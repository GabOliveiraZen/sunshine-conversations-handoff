const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    var jsonConfig = JSON.parse(fs.readFileSync(__dirname + '/config.json','utf-8'));

    var suncoToken = signJwt(jsonConfig.suncoKeyId, jsonConfig.suncoSecret);

    let options = {
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + suncoToken
        }
    }

    if(event.body){
        console.log(event.body);
        //Get conversation data
        var body = JSON.parse(event.body)
        var conversationId = body.events[0].payload.conversation.id;
        
        let url = `https://api.smooch.io/v2/apps/${jsonConfig.appId}/conversations/${conversationId}`;

        let resp = await axios.get(url, options);

         
        let convoMetadata = resp.data.conversation.metadata;
        let integrations = jsonConfig.integrations;


        let integrationRelationship = integrations.find(relation => relation.integrationId == body.events[0].payload.message.source.integrationId);

        //Sets up the brand id only if a relationship is found
        if(integrationRelationship) convoMetadata['dataCapture.systemField.brand_id'] = integrationRelationship.brandId;
        convoMetadata['dataCapture.systemField.requester.email'] = body.events[0].payload.message.author.user.profile.email;

        //Start Pass Control process
        url = `https://api.smooch.io/v2/apps/${jsonConfig.appId}/conversations/${conversationId}/passControl`;

        let data = {
            switchboardIntegration: 'zd-agentWorkspace',
            metadata: convoMetadata   //forward conversation metadata
        };
    
        resp = await axios.post(url, data, options);
        
        response = {
            'statusCode': 200,
            'body': {
                'message': 'success'
            }
        }
            
    }
    

    return response
};

var signJwt = function (suncoKeyId,suncoSecret) {
    return jwt.sign(
        {
            scope: 'app'
        },
        suncoSecret,
        {
            header: {
                alg: 'HS256',
                typ: 'JWT',
                kid: suncoKeyId
            }
        }
    );
};
