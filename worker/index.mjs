import {handleApi} from '../src/api.mjs';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return handleApi(request,env);
  return env.ASSETS.fetch(request);
 }
};
