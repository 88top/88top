import { Buffer } from 'node:buffer';

import {
  aesX as aesXModule,
  desX as desXModule,
  rsaX as rsaXModule,
  tripleDesX as tripleDesXModule,
} from '@main/utils/hiker';
import { batchFetch, fetch } from '@main/utils/hiker/request/asyncAxios';
import JSON5 from 'json5';

const hasPropertyIgnoreCase = (obj: Record<string, string>, propertyName: string) => {
  return Object.keys(obj).some((key) => key.toLowerCase() === propertyName.toLowerCase());
};

const valueStartsWith = (obj: Record<string, string>, propertyName: string, prefix: string) => {
  const key = Object.keys(obj).find((key) => key.toLowerCase() === propertyName.toLowerCase());
  return key !== undefined && obj[key].startsWith(prefix);
};

const req = async (
  url: string,
  cobj: Record<string, any>,
): Promise<{ code: number; content: string; headers: Record<string, string> }> => {
  const obj = { ...cobj };

  try {
    if (obj.data) {
      obj.body = obj.data;
      const isForm =
        obj.postType === 'form' ||
        (hasPropertyIgnoreCase(obj.headers, 'Content-Type') &&
          valueStartsWith(obj.headers, 'Content-Type', 'application/x-www-form-urlencoded'));

      if (isForm) {
        obj.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        obj.body = new URLSearchParams(obj.data).toString();
        delete obj.postType;
      }
      delete obj.data;
    }

    if (Object.hasOwn(obj, 'redirect')) obj.redirect = !!obj.redirect;
    if (obj.buffer === 2) obj.toHex = true;
    obj.withHeaders = true;

    let resp: any = await fetch(url, obj);
    resp = JSON5.parse(resp);
    const res = {
      code: resp?.statusCode ?? 500,
      headers: Object.fromEntries(Object.entries(resp?.headers || {}).map(([k, v]) => [k, v?.[0]])),
      content: resp?.body || '',
    };

    if (obj.buffer === 2) {
      res.content = Buffer.from(resp!.body, 'hex').toString('base64');
    }

    return res;
  } catch (error) {
    console.error(error);
    return { code: 500, headers: {}, content: '' };
  }
};

const aesX = (mode, encrypt, input, inBase64, key, iv, outBase64) => {
  const modeLower = mode.toLocaleLowerCase();
  const modeStandard = modeLower.split('/').slice(-1)?.[0] || 'cbc';

  return aesXModule(modeStandard, encrypt, input, inBase64, key, iv, outBase64);
};

const desX = (mode, encrypt, input, inBase64, key, iv, outBase64) => {
  const modeLower = mode.toLocaleLowerCase();
  const fn = modeLower.includes('desede') ? tripleDesXModule : desXModule;
  const modeStandard = modeLower.split('/').slice(-1)?.[0] || 'cbc';

  return fn(modeStandard, encrypt, input, inBase64, key, iv, outBase64);
};

const rsaX = (mode, pub, encrypt, input, inBase64, key, outBase64) => {
  const modeMap = {
    'RSA/None/NoPadding': 'nopadding',
    'RSA/None/OAEPPadding': 'rsaes-oaep-sha1',
    'RSA/PKCS1': 'rsaes-pkcs1-v1_5',
  };
  const modeStandard = modeMap[mode] ?? 'rsaes-pkcs1-v1_5';

  return rsaXModule(modeStandard, pub, encrypt, input, inBase64, key, outBase64);
};

export { aesX, batchFetch, desX, req, rsaX };

export { BaseSpider, getProxy, joinUrl, local, md5X } from '@main/utils/hiker';
