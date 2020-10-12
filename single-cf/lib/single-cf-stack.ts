import * as cdk from "@aws-cdk/core";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import { Duration, RemovalPolicy } from "@aws-cdk/core";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Runtime } from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import { LambdaEdgeEventType } from "@aws-cdk/aws-cloudfront";

export class SingleCfStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const redirectLambda = new NodejsFunction(this, "RedirectLambda", {
      entry: `${__dirname}/redirect/index.ts`,
      handler: "handler",
      runtime: Runtime.NODEJS_12_X,
    });

    const httpApi = new apigatewayv2.HttpApi(this, "MyApiGateway");

    const helloWorldLambda = new NodejsFunction(this, "HelloWorldLambda", {
      entry: `${__dirname}/backend/index.ts`,
      handler: "handler",
      runtime: Runtime.NODEJS_12_X,
    });

    const lambdaIntegration = new apigatewayv2.LambdaProxyIntegration({
      handler: helloWorldLambda,
    });

    httpApi.addRoutes({
      path: "/api/helloworld", // You must include the `/api/` since CloudFront will not truncate it
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "CloudFrontOAI",
      {
        comment: `Allows CloudFront access to S3 bucket`,
      }
    );

    const websiteBucket = new s3.Bucket(this, "MyBucket", {
      removalPolicy: RemovalPolicy.DESTROY, // Using destroy so when you delete this stack, we will remove the S3 bucket created as well
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET],
          maxAge: 3000,
        },
      ],
    });

    // uploads index.html to s3 bucket
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset(`${__dirname}/frontend`)],
      destinationBucket: websiteBucket,
    });

    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "Grant Cloudfront Origin Access Identity access to S3 bucket",
        actions: ["s3:GetObject"],
        resources: [websiteBucket.bucketArn + "/*"],
        principals: [cloudfrontOAI.grantPrincipal],
      })
    );

    new cloudfront.CloudFrontWebDistribution(this, "MyDistribution", {
      comment: "CDN for Web App",
      defaultRootObject: "index.html",
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      originConfigs: [
        {
          // make sure your backend origin is first in the originConfigs list so it takes precedence over the S3 origin
          customOriginSource: {
            domainName: `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`,
          },
          behaviors: [
            {
              pathPattern: "/api/*", // CloudFront will forward `/api/*` to the backend so make sure all your routes are prepended with `/api/`
              allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              defaultTtl: Duration.seconds(0),
              forwardedValues: {
                queryString: true,
                headers: ["Authorization"], // By default CloudFront will not forward any headers through so if your API needs authentication make sure you forward auth headers across
              },
            },
          ],
        },
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket,
            originAccessIdentity: cloudfrontOAI,
          },
          behaviors: [
            {
              compress: true,
              isDefaultBehavior: true,
              defaultTtl: Duration.seconds(0),
              allowedMethods:
                cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              lambdaFunctionAssociations: [
                {
                  lambdaFunction: redirectLambda.currentVersion,
                  eventType: LambdaEdgeEventType.ORIGIN_RESPONSE,
                },
              ],
            },
          ],
        },
      ],
    });
  }
}
