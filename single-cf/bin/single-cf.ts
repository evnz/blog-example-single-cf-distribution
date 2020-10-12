#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SingleCfStack } from '../lib/single-cf-stack';

const app = new cdk.App();
new SingleCfStack(app, 'SingleCfStack');
