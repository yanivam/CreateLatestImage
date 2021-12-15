//dependencies
const { S3Client } = require('@aws-sdk/client-s3');
const util = require('util');

// get reference to S3 client
const s3 = new S3Client({
    region: 'us-east-2',
    signatureVersion: 'v4',
    credentials: {
        accessKeyId: process.env.AWSAccessKeyId,
        secretAccessKey: process.env.AWSSecretAccessKey
    }
})

exports.handler = async (event, context, callback) => {
    // Read options from the event parameter.
    console.log("Reading options from event:\n", util.inspect(event, { depth: 5 }));
    const srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    const dstBucket = "annaboto-latest/";
    const dstKey = dstBucket + srcKey.split("/")[0] + "/latest.png";
    // Infer the image type from the file suffix.
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }
    // Check that the image type is supported
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpg" && imageType != "png") {
        console.log(`Unsupported image type: ${imageType}`);
        return;
    }
    // Download the image from the S3 source bucket.
    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        };
        var origimage = await s3.getObject(params).promise();
    } catch (error) {
        console.log(error);
        return;
    }
    // Upload the thumbnail image to the destination bucket
    try {
        console.log(dstKey)
        const destparams = {
            Bucket: dstBucket,
            Key: dstKey,
            Body: origimage.Body,
            ContentType: "image"
        };
        const putResult = await s3.putObject(destparams).promise();
    } catch (error) {
        console.log(error);
        return;
    }
    console.log('Successfully resized ' + srcBucket + '/' + srcKey +
        ' and uploaded to ' + dstBucket + '/' + dstKey);
};