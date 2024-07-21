import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Define all the environment files - Start
const defaultEnv = 'environments/.env';
const devEnv = 'environments/.env.dev';
const testEnv = 'environments/.env.test';
const prodEnv = 'environments/.env.prod';
// Define all the environment files - End

// Ensure a .env file exists
if (!fs.existsSync(path.resolve(process.cwd(), defaultEnv))) {
	throw new Error('Please add a .env file to the root directory with a NODE_ENV value');
}

// Get env specific file
const getEnvFile = (environment: string): string => {
	switch (environment) {
		case 'dev':
			return devEnv;
		case 'test':
			return testEnv;
		case 'prod':
			return prodEnv;
		default:
			return defaultEnv;
	}
};

// Get the current environment.
export const getEnvironment = (): string => {
	return getEnvValue('NODE_ENV');
};

// Get a value from the .env.* file
export const getEnvValue = (variable: string): string => {
	const val = process.env[variable];
	if (!val) {
		throw new Error(
			`Tried to access [${variable}] environment variable, but that does not exist in [${getEnvironment()}] environment`
		);
	}
	return val;
};

// Configure dotenv with the configuration in the .env file
dotenv.config({
	path: path.resolve(process.cwd(), defaultEnv),
});

// Re-configure dotenv with specific environment
dotenv.config({
	path: path.resolve(process.cwd(), getEnvFile(getEnvironment() as string)),
});
