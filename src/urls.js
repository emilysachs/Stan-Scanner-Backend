require('dotenv').config();

var env = process.env.NODE_ENV
var envString = env.toUpperCase()

//access the environment variables for this environment

export default {
  	"appUrl": process.env[envString + '_APP_URL'],
	"apiUrl": process.env[envString + '_APP_API_URL'],
	"appCallback": process.env[envString + '_APP_CALLBACK']	
}