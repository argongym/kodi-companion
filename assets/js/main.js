window.onload = () => {
    /* PWA */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/serviceworker-1.0.0.js');
    }
}

document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
        showPlayer: false,
        video: '',
        status: {},
        timerId: null,
        checkStatus: {},
        updateStatus(){
            if(this.timerId) return false;
            this.checkStatus();
        },
        async init() {
            screen.orientation.lock("portrait")
            .then(
                success => console.log(success),
                failure => console.log(failure)
            )                
        },
        async downloadsInit() {
            this.checkStatus = (async function() {
                let status = await GET('/torrents/status');
                this.status = status;
                if (status.active){
                    this.timerId = setTimeout(this.checkStatus, 1000);
                } else {
                    this.timerId = null;
                }
            }).bind(this);
            this.checkStatus();
        },
        async add(tid) {
            let status = await GET('/torrents/add?tid=' + tid);
            this.updateStatus();
        },
        async pause(tid) {
            let status = await GET('/torrents/pause?tid=' + tid);
        },
        async resume(tid) {
            let status = await GET('/torrents/resume?tid=' + tid);
        },
        async remove(tid) {
            let status = await GET('/torrents/remove?tid=' + tid);
        },
        async play(path) {
            //this.video = 'http://192.168.1.86:8080/vfs/' + path;
            let status = await GET('/movies/play?path=' + encodeURIComponent(path));
        },
        async deletePath(path) {
            let status = await GET('/movies/delete?path=' + encodeURIComponent(path));
        },
        async clean(path) {
            let status = await GET('/movies/clean');
        },
        async kodi(path) {
            let status = await GET('/movies/kodi');
        },
        async rename(source, target) {
            let status = await GET('/movies/rename?source=' + encodeURIComponent(source) + '&target=' + encodeURIComponent(target));
        },
        onVideoPlay(){
            requestFullscreen();
            screen.orientation.lock("landscape");
        },
        onVideoPause(){
            exitFullscreen();
            screen.orientation.lock("portrait");
        },
    }));
});

async function GET(url, type = 'json'){
    return new Promise(function(resolve, reject){
        let xhr = new XMLHttpRequest;
        xhr.open("GET", url);
        xhr.responseType = type;
        xhr.send();
        xhr.onload = () => resolve(xhr.response);
    });
}

function requestFullscreen(){
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
        document.documentElement.webkitRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
}
function exitFullscreen(){
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}