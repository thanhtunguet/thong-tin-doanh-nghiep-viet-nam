import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Repository } from 'react3l';
import {
  SOURCE_URL,
  STATIC_SOURCE_URL,
  STATIC_WEB_URL,
  WEB_URL,
} from './dotenv';

export const httpConfig: AxiosRequestConfig = {};

function replaceHtml(html: string) {
  return html
    .split(SOURCE_URL)
    .join(WEB_URL)
    .split(STATIC_SOURCE_URL)
    .join(STATIC_WEB_URL);
}

Repository.requestInterceptor = async (config: AxiosRequestConfig) => {
  Object.assign(config.headers, {
    'cache-control': 'max-age=0',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  return config;
};

Repository.responseInterceptor = async (
  response: AxiosResponse,
): Promise<AxiosResponse> => {
  if (
    response.headers['content-type']?.startsWith('text/html') &&
    typeof response.data === 'string'
  ) {
    response.data = replaceHtml(response.data);
  }
  return response;
};

Repository.errorInterceptor = async (error: AxiosError) => {
  if (error.request && error.request.url) {
    console.log('error uri: ', error.request.url);
  } else {
    console.log('error: ', error);
  }
  throw error;
};
