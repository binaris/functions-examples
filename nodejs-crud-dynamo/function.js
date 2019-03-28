const AWS = require('aws-sdk');

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION
} = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
  endpoint: `https://dynamodb.${AWS_REGION}.amazonaws.com`,
});

const dynamoDB = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

function validatedBody(body, ...fields) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      throw new Error(`Missing request body parameter: ${field}.`);
    }
  }
  return body;
}

const TableName = 'Drivers';
const PrimaryKey = 'driverID';

exports.createDriversTable = async () => {
  return dynamoDB.createTable({
    TableName,
    KeySchema: [{
      AttributeName: PrimaryKey,
      KeyType: 'HASH',
    }],
    AttributeDefinitions: [{
      AttributeName: PrimaryKey,
      AttributeType: 'S',
    }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    }
  }).promise();
};

exports.createDriver = async (body) => {
  const {
    driverID,
    rideStatus,
    lastLocation
  } = validatedBody(body, 'driverID', 'rideStatus', 'lastLocation');

  return docClient.put({
    TableName,
    Item: {
      driverID,
      rideStatus,
      lastLocation,
    }
  }).promise();
};

exports.readDriver = async (body) => {
  const { driverID } = validatedBody(body, 'driverID');
  return docClient.get({ TableName, Key: { driverID } }).promise();
};

exports.updateDriver = async (body) => {
  const {
    driverID,
    rideStatus,
    lastLocation
  } = validatedBody(body, 'driverID', 'rideStatus', 'lastLocation');

  return docClient.update({
    TableName,
    Key: { driverID },
    UpdateExpression: 'SET #loc.#lon = :lonVal, #loc.#lat = :latVal, #rideStatus= :r',
    ExpressionAttributeNames: {
      '#loc': 'lastLocation',
      '#lon': 'longitude',
      '#lat': 'latitude',
      '#rideStatus': 'rideStatus',
    },
    ExpressionAttributeValues: {
      ':r': rideStatus,
      ':lonVal': lastLocation.longitude,
      ':latVal': lastLocation.latitude,
    },
    ReturnValues: 'UPDATED_NEW'
  }).promise();
};

exports.deleteDriver = async (body) => {
  const { driverID } = validatedBody(body, 'driverID');
  return docClient.delete({ TableName, Key: { driverID } }).promise();
};
