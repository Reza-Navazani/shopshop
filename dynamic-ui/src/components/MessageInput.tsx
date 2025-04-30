import React, { useState } from "react";

interface MessageInputProps {
    onMessageSent?: (message: string) => void;
    className?: string;
    disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onMessageSent, className, disabled }) => {
    const [message, setMessage] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSendMessage = async () => {
        if (!message.trim() || disabled) return;
        
        try {
            onMessageSent?.(message);
            setMessage(""); // Clear the input
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    return (
        <div className={`${className} bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200`}>
            <div className="flex flex-col p-2 sm:p-4 gap-1 sm:gap-2">
                {isFocused && (
                    <div className="text-xs sm:text-sm text-gray-500">
                        Ask about products to compare (e.g., "Compare bread prices in Canada")
                    </div>
                )}
                <div className="flex items-center gap-1 sm:gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Ask about products..."
                        className="flex-1 bg-transparent outline-none text-sm sm:text-base text-gray-700 placeholder-gray-400"
                        disabled={disabled}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || disabled}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white font-medium transition-all duration-200 ${
                            disabled || !message.trim()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {disabled ? 'Analyzing...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};