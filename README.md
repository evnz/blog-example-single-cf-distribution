# Blog example: Single CloudFront Distribution for both your S3 Web App and API Gateway backend

Example of a single Amazon CloudFront distribution for both your web app hosted on S3 bucket and API Gateway backend

[Link to blog](https://dev.to/evnz/single-cloudfront-distribution-for-s3-web-app-and-api-gateway-15c3)

This example uses AWS CDK to build out a working example of a single CloudFront distribution that routes to both a web app hosted in S3 and a backend API. Although API GatewayV2 has been used as the backend here, the principles used in this example should work with any other backends (or otherwise known as custom origins in CloudFront). For more information please visit the blog linked above.

## Deployment

**CAUTION**: This stack contains a Lambda@Edge resource which may take some time to delete (you also may see errors requiring manual intenvention using CDK destroy)

0. Prequisites

   - AWS account with permissions to create CloudFront, S3 and API GatewayV2 resources and everyting inbetween (IAM etc)
   - AWS CLI (configured with your account so you can deploy this directly into your environment)
   - git
   - NodeJS
   - Yarn (You can use NPM)
   - Docker (for compiling the lambdas)

   For more information please visit the blog post instead (linked above).

1. Clone this repository locally

```shell
$ git clone https://github.com/evnz/blog-example-single-cf-distribution.git
```

2. Download all the dependencies locally

```shell
# change directory to single-cf
$ cd single-cf
# download all the dependencies via yarn (you can also use npm)
$ yarn
```

3. Build and deploy

```shell
$ yarn build
# if you haven't bootstrapped your environment previously, bootstrap it first
$ yarn cdk bootstrap
# This might take awhile to compile and package all the typescript lambdas and deploying the cloudfront distribution
$ yarn cdk deploy
```

4. Test it by visiting different endpoints on the cloudfront distribution

```md
1. `/` should return you the hello world HTML page.
2. `/api/helloworld` should return you the machine friendly hello world message
3. `/api/non-existent-endpoint` should return you a 'not found' message
4. `/api/non-existent-page` should redirect back to `/` with the hello world HTML page
```

5. Now you can delete the stack and remove the CDK bootstrap

```
Go to S3 Web Console and remove the content inside the S3 bucket we created (should just be the index.html file)
We can't delete a non-empty bucket so we will just have to manually empty it out first.
```

```shell
$ yarn cdk destroy
...
# And you should see some error about Lambda@Edge (at this point you will have to wait for Lambda@Edge to be removed from all the cache locations and then manually delete the stack from the Cloudformation console - yes I know it sucks but caching is hard)
```

```
If you are not planning to use CDK in this account anymore remove the bootstrap manually via the AWS Cloudformation web console (the stack name should be called CDKToolKit)
```
