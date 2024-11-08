import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Repository } from 'react3l';
import { SOURCE_URL, WEB_URL } from './dotenv';

export const httpConfig: AxiosRequestConfig = {};

function replaceHtml(html: string) {
  return html.split(SOURCE_URL).join(WEB_URL);
}

Repository.responseInterceptor = async (
  response: AxiosResponse,
): Promise<AxiosResponse> => {
  if (
    response.headers['content-type'] === 'text/html' &&
    typeof response.data === 'string'
  ) {
    response.data = replaceHtml(response.data);
  }
  return response;
};

Repository.errorInterceptor = async (error: AxiosError) => {
  if (error.request) {
    console.log('error uri: ', error.request.url);
  }
  throw error;
};
