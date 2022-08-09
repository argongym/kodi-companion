// Website you intended to retrieve for users.
const upstream = 'rutracker.org'

// Replace texts.
const replace_dict = {
    '$upstream': '$custom_domain',
    '//rutracker.org': ''
}

addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {

    const user_agent = request.headers.get('user-agent');

    let response = null;
    let url = new URL(request.url);
    let url_hostname = url.hostname;

    url.host = upstream;
    upstream_domain = upstream;

    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);
    let request_body = request.body;
    let request_body_buffer = '';
    let new_request = {
        method: method,
        headers: new_request_headers,
        redirect: "manual"
    };
    if(method == 'POST') new_request.body = await request.arrayBuffer();
    let request_redirect = request.redirect;

    new_request_headers.set('Host', upstream);
    new_request_headers.set('User-Agent', user_agent);
    let original_response = await fetch(url.href, new_request);

    let original_text = null;
    let response_headers = original_response.headers;
    let new_response_headers = new Headers(response_headers);
    let status = original_response.status;
    for (const header of new_response_headers.entries()) {
        new_response_headers.set(header[0], header[1].replaceAll(/rutracker\.org/g, url_hostname))
        //new_response_headers.set(header[0], header[1].replaceAll(/; domain\=[^,]+/g, ''))
    }
    for (const cookie of response_headers.getAll('set-cookie')){
        new_response_headers.set('set-cookie', cookie.replaceAll(/; domain\=[^,]+/g, ''));
    }

    new_response_headers.set('Cache-Control', 'no-store');
    new_response_headers.set('access-control-allow-origin', '*');
    new_response_headers.set('access-control-allow-credentials', true);
    new_response_headers.delete('content-security-policy');
    new_response_headers.delete('content-security-policy-report-only');
    new_response_headers.delete('clear-site-data');

    original_text = original_response.body;

    response = new Response(original_text, {
        status,
        headers: new_response_headers
    })
    return response;
}
