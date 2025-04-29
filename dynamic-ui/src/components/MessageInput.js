import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export const MessageInput = ({ onMessageSent, className, disabled }) => {
    const [message, setMessage] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const handleSendMessage = async () => {
        if (!message.trim() || disabled)
            return;
        try {
            onMessageSent?.(message);
            setMessage(""); // Clear the input
        }
        catch (err) {
            console.error("Failed to send message:", err);
        }
    };
    return (_jsx("div", { className: `${className} bg-white rounded-2xl shadow-lg border border-gray-200`, children: _jsxs("div", { className: "flex flex-col p-4 gap-2", children: [isFocused && (_jsx("div", { className: "text-sm text-gray-500", children: "Ask about products to compare (e.g., \"Compare bread prices in Canada\")" })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "text", value: message, onChange: (e) => setMessage(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSendMessage(), onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), placeholder: "Ask about products...", className: "flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400", disabled: disabled }), _jsx("button", { onClick: handleSendMessage, disabled: !message.trim() || disabled, className: `px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 ${disabled || !message.trim()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'}`, children: disabled ? 'Analyzing...' : 'Send' })] })] }) }));
};
