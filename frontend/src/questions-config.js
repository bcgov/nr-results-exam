import { env } from './env';

const questionsConfig = {
    apiKey: env.VITE_QUESTIONS_API_KEY || "jazz",
};


export default questionsConfig;
