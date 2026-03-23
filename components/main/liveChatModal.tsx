import React, { useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { colors } from '@/constants';

type Message = {
    role: 'assistant' | 'user';
    content: string;
};

type ChatHistory = {
    messages: Message[];
}[];

type Props = {
    showTranscript: boolean;
    setShowTranscript: (value: boolean) => void;
    chatHistory: ChatHistory;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LiveChatModal = ({ showTranscript, setShowTranscript, chatHistory }: Props) => {
    const memoizedMessages = useMemo(() => {
        const messages = chatHistory[0]?.messages || [];
        return [...messages].reverse().map(msg => {
            let content = msg.content;
            // Replace <br> tags with newlines
            content = content.replace(/<br\s*\/?>/gi, '\n');
            // Replace pipe used as line break before list items: "| -" → newline + "-"
            content = content.replace(/\s*\|\s*(?=-\s)/g, '\n');
            return { ...msg, displayContent: content };
        });
    }, [chatHistory]);

    const maxBubbleWidth = SCREEN_WIDTH - 80;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showTranscript}
            onRequestClose={() => setShowTranscript(false)}
        >
            {showTranscript && (
                <View
                    className="flex-1 justify-end w-full"
                    style={{
                        backgroundColor: `${colors.dark[100]}E6`,
                        minHeight: SCREEN_HEIGHT
                    }}
                >
                    <View
                        style={{ backgroundColor: colors.light[100] }}
                        className="rounded-t-[30px] h-[90%] p-6"
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-8 px-2">
                            <View>
                                <Text className="text-[10px] font-black uppercase tracking-[3px] text-black/20 mb-1">
                                    Synchronization
                                </Text>
                                <Text className="text-2xl font-black" style={{ color: colors.dark[100] }}>
                                    Live Logs
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowTranscript(false)}
                                className="w-12 h-12 rounded-2xl items-center justify-center border border-gray-100 bg-gray-50"
                            >
                                <MaterialCommunityIcons name="close" size={20} color={colors.dark[100]} />
                            </TouchableOpacity>
                        </View>

                        {/* Messages List / Empty State */}
                        {memoizedMessages.length > 0 ? (
                            <FlatList
                                showsVerticalScrollIndicator={false}
                                data={memoizedMessages}
                                inverted
                                keyExtractor={(_, index) => `chat-msg-${index}`}
                                contentContainerStyle={{ paddingVertical: 10, paddingBottom: 40 }}
                                renderItem={({ item: msg }) => {
                                    const isAssistant = msg.role === 'assistant';

                                    return (
                                        <View className={`mb-6 ${isAssistant ? 'self-start mr-10' : 'self-end ml-10'}`}>
                                            <View
                                                className={`px-5 py-4 rounded-[26px] border ${isAssistant ? 'rounded-tl-none shadow-sm' : 'rounded-tr-none'
                                                    }`}
                                                style={{
                                                    backgroundColor: isAssistant ? colors.light[100] : colors.dark[100],
                                                    borderColor: isAssistant ? colors.light[200] : colors.dark[200],
                                                }}
                                            >
                                                <Markdown
                                                    rules={{
                                                        table: (node, children, parent, styles) => {
                                                            const firstRow = node.children?.find((c: any) => c.type === 'thead' || c.type === 'tbody');
                                                            const firstTr = firstRow?.children?.[0];
                                                            const colCount = firstTr?.children?.length || 3;
                                                            const COL_WIDTH = Math.max(120, (maxBubbleWidth - 40) / colCount);
                                                            const tableWidth = COL_WIDTH * colCount;

                                                            return (
                                                                <View
                                                                    key={node.key}
                                                                    style={{ marginVertical: 12, width: maxBubbleWidth - 40 }}
                                                                >
                                                                    <ScrollView horizontal showsHorizontalScrollIndicator={tableWidth > maxBubbleWidth - 40}>
                                                                        <View style={[styles.table, { width: tableWidth }]}>
                                                                            {children}
                                                                        </View>
                                                                    </ScrollView>
                                                                </View>
                                                            );
                                                        },
                                                        tr: (node, children, parent, styles) => (
                                                            <View key={node.key} style={[styles.tr, { flexDirection: 'row' }]}>
                                                                {children}
                                                            </View>
                                                        ),
                                                        td: (node, children, parent, styles) => (
                                                            <View key={node.key} style={[styles.td, { flex: 1 }]}>
                                                                {children}
                                                            </View>
                                                        ),
                                                        th: (node, children, parent, styles) => (
                                                            <View key={node.key} style={[styles.th, { flex: 1 }]}>
                                                                {children}
                                                            </View>
                                                        ),
                                                        image: (node, children, parent, styles) => (
                                                            <View style={{ alignItems: 'center', width: '100%' }}>
                                                                <Image
                                                                    key={node.key}
                                                                    source={{ uri: node.attributes.src }}
                                                                    style={[styles.image, {
                                                                        height: parent.some((p: any) => p.type === 'td' || p.type === 'th') ? 80 : 200,
                                                                        width: '100%'
                                                                    }]}
                                                                    resizeMode="contain"
                                                                    fadeDuration={0}
                                                                />
                                                            </View>
                                                        ),
                                                    }}
                                                    style={{
                                                        body: {
                                                            color: isAssistant ? colors.dark[100] : colors.light[100],
                                                            fontSize: 14,
                                                            lineHeight: 22,
                                                        },
                                                        image: {
                                                            borderRadius: 12,
                                                            marginVertical: 4,
                                                        },
                                                        table: {
                                                            borderWidth: 1,
                                                            borderColor: isAssistant ? colors.light[200] : colors.dark[200],
                                                            borderRadius: 14,
                                                            overflow: 'hidden',
                                                        },
                                                        tr: {
                                                            borderBottomWidth: 1,
                                                            borderColor: isAssistant ? colors.light[200] : colors.dark[200],
                                                        },
                                                        th: {
                                                            padding: 12,
                                                            backgroundColor: isAssistant ? colors.light[200] : colors.dark[200],
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        },
                                                        td: {
                                                            padding: 12,
                                                            borderRightWidth: 1,
                                                            borderColor: isAssistant ? colors.light[200] : colors.dark[200],
                                                            justifyContent: 'center',
                                                        },
                                                    }}
                                                >
                                                    {msg.displayContent}
                                                </Markdown>
                                            </View>
                                        </View>
                                    );
                                }}
                            />
                        ) : (
                            <View className="flex-1 justify-center items-center px-10">
                                <View className="w-20 h-20 bg-gray-50 rounded-[30px] items-center justify-center mb-6 border border-gray-100">
                                    <MaterialCommunityIcons name="brain" size={40} color={colors.dark[100]} style={{ opacity: 0.1 }} />
                                </View>
                                <Text className="text-center text-sm font-black text-black uppercase tracking-[2px] opacity-40 mb-2">
                                    Zero Interaction
                                </Text>
                                <Text className="text-center text-xs text-gray-400 font-bold leading-5">
                                    This dossier has not yet established a communication channel with the AI assistant.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </Modal>
    );
};

export default LiveChatModal;