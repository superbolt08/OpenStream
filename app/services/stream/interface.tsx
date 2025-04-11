export interface Stream {
  id: string;
  streamer: string;
  title: string;
  playbackURL: string;
  createdAt: string;
  chatId: string;
}

export interface ChatMessage {
  user: string;
  text: string;
  color: string;
  chatId: string | undefined;
}

