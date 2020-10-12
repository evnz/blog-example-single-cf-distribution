"use strict";

exports.handler = (event: any, context: any, callback: any) => {
  const response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;

  /**
   * This function updates the HTTP status code in the response to 302, to redirect to another
   * path (cache behavior) that has a different origin configured. Note the following:
   * 1. The function is triggered in an origin response
   * 2. The response status from the origin server is an error status code (4xx or 5xx)
   */

  if (response.status == 404) {
    const redirect_path = `/`; //redirects back to root so to index.html

    response.status = 302;
    response.statusDescription = "Found";

    /* Drop the body, as it is not required for redirects */
    response.body = "";
    response.headers["location"] = [{ key: "Location", value: redirect_path }];
  }

  callback(null, response);
};
