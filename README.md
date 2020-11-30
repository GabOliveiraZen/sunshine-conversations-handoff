# Middleware for Sunshine Conversations

This serverless application manages a conversation between Sunshine Conversations and Zendesk Support with Agent Workspace, leveraging Switchboard in order to bring context to Agent Workspace and support multi-brand instances

## Requirements

* Zendesk Support instance with Agent Workspace enabled for Social Messaging
* Sunshine Conversations account
* AWS Account

## Installation

1. Clone this repository `git clone https://github.com/GabOliveiraZen/sunshine-conversations-handoff.git`
1. Setup [AWS SAM](https://aws.amazon.com/pt/serverless/sam/)
1. Edit `config.json` to insert your Sunshine Conversations credentials and brand/integration relationships
1. [Deploy](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started-hello-world.html) the serverless application on AWS. It'll create a Lambda function and an API Gateway endpoint
1. Create a Webhook on Sunshine Conversations listening to `conversation:message` events for the API Gateway endpoint
1. Create a [Switchboard](https://docs.smooch.io/rest/#operation/createSwitchboard) on Sunshine Conversations 
1. Find the API Gateway end point using the [List Integrations](https://docs.smooch.io/rest/#operation/listIntegrations) method and copy the integration ID
1. Create a [Switchboard Integration](https://docs.smooch.io/rest/#operation/createSwitchboardIntegration) for the copied integrationId
1. Create a Switchboard Integration passing `zd:agentWorkspace` as `integrationType` setting the newly create integration as `nextSwitchboardIntegrationId` and `zd-agentWorkspace`as `name`
1. [Activate](https://docs.smooch.io/rest/#operation/updateSwitchboard) the Switchboard setting the middleware integration as the `defaultSwitchboardIntegrationId`


## What does it do?

This application will take the first message sent to a conversation and perform the following steps:
1. Grab Conversation Metadata
1. Check if there's a specific brand for that integration (Whatsapp number, Web Messenger, etc)
1. Check if there's an email associated to the user
1. Send conversation metadata, brand ID and email as metadata and hand the conversation off to Agent Workspace


**IMPORTANT:** Although this code just blindly forward metadata to Agent Workspace, you can use it a the foundation for your chatbot to hand off the conversation. In order to do so, just replace the step where you forward metadata with your own data

## Adding Metadata to a conversation

You can follow [this guide](https://docs.smooch.io/guide/using-metadata/) on how to create metadata

### Agent Workspace metadata schema

Agent Workspace understands metadata only in a certain format, which works like this:

* All fields start with `dataCapture`
* You can populate system fields and custom ticket fields
  * For system fields, the format should be `dataCapture.systemField`
  * For custom ticket fields, the format should be `dataCapture.ticketField`
* The next part of the structure is the field you wish to populate
  * For system fields it's the field name (brand_id, group_id, etc) (eg. `dataCapture.systemField.brand_id`)
  * For custom ticket fields it's the field ID (e.g. `dataCapture.ticketField.321394582094`)

**Supported System Fields**

* requester
* group_id
* subject
* description
* priority
* recipient
* organization_id
* assignee_id
* tags (single string with tags separated by `,`)
* brand_id

## Brand/Integration Relationship

The configuration file establishes a relationship between Sunshine Conversations integrations and brands. This helps when you have different channels (multiple WhatsApp numbers, for example) and each one should go to a different team in a multi-brand instance. The JSON structure is an array of objects with two fields:
* **integrationId** - Sunshine Conversations integration ID
* **brandId** - Support Brand ID

When properly set up, this will always route conversations to the correct brand and you don't need to take care of that in a separate application.
