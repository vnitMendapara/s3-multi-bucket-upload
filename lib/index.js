"use strict"

/**
 * Module dependencies
 */

/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require("lodash")
const AWS = require("aws-sdk")

module.exports = {
  provider: "aws-s3-multibucket",
  name: "Amazon Web Service S3 (Multibucket1)",
  auth: {
    public: {
      label: "Access API Token",
      type: "text"
    },
    private: {
      label: "Secret Access Token",
      type: "text"
    },
    region: {
      label: "Region",
      type: "enum",
      values: [
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "ca-central-1",
        "ap-south-1",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-northeast-3",
        "ap-southeast-1",
        "ap-southeast-2",
        "cn-north-1",
        "cn-northwest-1",
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "sa-east-1"
      ]
    },
    bucket: {
      label: "Main Bucket",
      type: "text"
    },
    videoPath: {
      label: "Video Path",
      type: "text"
    }
    // videoBucket: {
    //   label: 'Video Bucket',
    //   type: 'text'
    // }
  },
  init: config => {
    // configure AWS S3 bucket connection
    AWS.config.update({
      accessKeyId: config.public,
      secretAccessKey: config.private,
      region: config.region
    })

    const S3 = new AWS.S3({
      apiVersion: "2006-03-01",
      params: {
        Bucket: config.bucket
      }
    })

    const S3Video = new AWS.S3({
      apiVersion: "2006-03-01",
      params: {
        Bucket: config.videoPath
      }
    })

    const IsVideoExtension = function(ext) {
      let _videoExtensions = [
        "webm",
        "mp4",
        "mpg",
        "MP2",
        "MPEG",
        "MPE",
        "MPV",
        "OGG",
        "MP4",
        "m4a"
      ]

      // check if upload is a video //
      let _normalizedExt = ext.toLowerCase()
      for (var i = 0; i < _videoExtensions.length; i++) {
        if (_normalizedExt.indexOf(_videoExtensions[i].toLowerCase()) != -1) {
          // str contains arr[i] //
          return true
        }
      }
    }

    return {
      upload: file => {
        console.log("[strapi-upload-aws-s3-multibucket] Upload(file)")
        return new Promise((resolve, reject) => {
          // upload file on S3 bucket

          let _isVideo = IsVideoExtension(file.ext)

          var path = file.path ? `${file.path}/` : ""

          if (_isVideo) path = config.videoPath + path

          const uploadObject = {
            Key: `${path}${file.hash}${file.ext}`,
            Body: new Buffer(file.buffer, "binary"),
            // ACL: "public-read",
            ContentType: file.mime
          }

          let _s3Object = _isVideo ? S3Video : S3
          _s3Object.upload(uploadObject, (err, data) => {
            if (err) {
              return reject(err)
            }
            // set the bucket file url
            file.url = data.Location
            resolve()
          })
        })
      },
      delete: file => {
        let _isVideo = IsVideoExtension(file.ext)
        // var _s3Object = (_isVideo) ? S3Video : S3;

        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = file.path ? `${file.path}/` : ""
          S3.deleteObjects(
            {
              Key: `${path}${file.hash}${file.ext}`
            },
            (err, data) => {
              if (err) {
                return reject(err)
              }
              resolve()
            }
          )
        })
      }
    }
  }
}
