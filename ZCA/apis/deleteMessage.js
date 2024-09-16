import { appContext } from "../context.js";
import { ZaloApiError } from "../Errors/index.js";
import { GroupMessage, Message, MessageType } from "../models/Message.js";
import { encodeAES, handleZaloResponse, removeUndefinedKeys, request } from "../utils.js";

export function removeMessageFactory(api) {
    const URLType = {
        [MessageType.DirectMessage]: `${api.zpwServiceMap.chat[0]}/api/message/delete?zpw_ver=${api.API_VERSION}&zpw_type=${api.API_TYPE}`,
        [MessageType.GroupMessage]: `${api.zpwServiceMap.group[0]}/api/group/deletemsg?zpw_ver=${api.API_VERSION}&zpw_type=${api.API_TYPE}`,
    };

    /**
     * Delete a message
     *
     * @param message Message or GroupMessage instance
     * @param onlyMe Delete message for only you
     *
     * @throws ZaloApiError
     */
    return async function deleteMessage(message, onlyMe = true) {
        if (!appContext.secretKey)
            throw new ZaloApiError("Secret key is not available");
        if (!appContext.imei)
            throw new ZaloApiError("IMEI is not available");
        if (!appContext.cookie)
            throw new ZaloApiError("Cookie is not available");
        if (!appContext.userAgent)
            throw new ZaloApiError("User agent is not available");
        if (!(message instanceof Message) && !(message instanceof GroupMessage))
            throw new ZaloApiError("Expected Message or GroupMessage instance, got: " + (message?.constructor?.name));
        if (message.isSelf && onlyMe === false)
            throw new ZaloApiError("To delete your message for everyone, use undo api instead");

        const params = {
            toid: message instanceof Message ? message.threadId : undefined,
            grid: message instanceof GroupMessage ? message.threadId : undefined,
            cliMsgId: Date.now(),
            msgs: [
                {
                    cliMsgId: String(message.data.cliMsgId),
                    globalMsgId: String(message.data.msgId),
                    ownerId: String(message.data.uidFrom),
                    destId: String(message.threadId),
                },
            ],
            onlyMe: onlyMe ? 1 : 0,
            imei: message instanceof Message ? appContext.imei : undefined,
        };

        removeUndefinedKeys(params);

        const encryptedParams = encodeAES(appContext.secretKey, JSON.stringify(params));
        if (!encryptedParams)
            throw new ZaloApiError("Failed to encrypt message");

        const response = await request(URLType[message.type], {
            method: "POST",
            body: new URLSearchParams({
                params: encryptedParams,
            }),
        });

        const result = await handleZaloResponse(response);
        if (result.error)
            throw new ZaloApiError(result.error.message, result.error.code);

        return result.data;
    };
}
