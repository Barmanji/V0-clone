export function lastAssistantTextMessageContent(result: any){
    const lastAssistantTextMessageIndex = result.output.findLastIndex(
        (message: any) => message.role === "assistant"
    )
    const message = result.output[lastAssistantTextMessageIndex]
    return message?.content ? typeof message.content === "string" ? message.content : message.content.map((c: any)=>c.text).join("") : undefined
}

