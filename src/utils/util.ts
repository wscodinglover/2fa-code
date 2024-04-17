import { Storage } from "@plasmohq/storage"

import TOTP from "./totp"

export const storage = new Storage({
  area: "local"
})

// 解析url
function parseURL(uri) {
  if (typeof uri !== "string" || uri.length < 7) return null
  let source = decodeURIComponent(uri)
  let data = source.split("otpauth://totp/")[1]
  if (data == null) return null
  /**
   * 数据截断
   */
  let isHaveIssuer =
    data.split("?")[0].indexOf(":") != -1 &&
    data.split("?")[0].indexOf(":") != 0
  let remark = ""
  if (isHaveIssuer) {
    console.log(data)
    remark = data.split("?")[0].split(":")[1]
  } else {
    console.log(data)
    remark = data.split("?")[0]
  }
  let issuer = data.split("issuer=")[1]
  let secret = data.split("?")[1].split("&")[0].split("=")[1]
  if (secret == null) return null
  return { remark, issuer, secret }
}

export function getSecretCode(secret: string) {
  return TOTP.now(secret)
}

export default { storage, parseURL, getSecretCode }
