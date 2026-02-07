import { ENV } from "./env";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export interface VoiceOption {
  voice_id: string;
  name: string;
  description: string;
}

export interface TextToSpeechOptions {
  text: string;
  voice_id?: string; // Default: Rachel (professional female voice)
  model_id?: string; // Default: eleven_multilingual_v2
  stability?: number; // 0-1, default: 0.5
  similarity_boost?: number; // 0-1, default: 0.75
  style?: number; // 0-1, default: 0
  use_speaker_boost?: boolean; // default: true
}

/**
 * Convert text to speech using ElevenLabs API
 * Returns audio buffer (MP3 format)
 */
export async function textToSpeech(
  options: TextToSpeechOptions
): Promise<Buffer> {
  const {
    text,
    voice_id = "21m00Tcm4TlvDq8ikWAM", // Rachel - professional female voice
    model_id = "eleven_multilingual_v2",
    stability = 0.5,
    similarity_boost = 0.75,
    style = 0,
    use_speaker_boost = true,
  } = options;

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voice_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ENV.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: {
          stability,
          similarity_boost,
          style,
          use_speaker_boost,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get list of available voices
 */
export async function getVoices(): Promise<VoiceOption[]> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      "xi-api-key": ENV.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.voices.map((v: any) => ({
    voice_id: v.voice_id,
    name: v.name,
    description: v.description || "",
  }));
}

/**
 * Predefined professional voices for real estate
 */
export const REAL_ESTATE_VOICES = {
  rachel: "21m00Tcm4TlvDq8ikWAM", // Professional female
  adam: "pNInz6obpgDQGcFmaJgB", // Professional male
  bella: "EXAVITQu4vr4xnSDxMaL", // Warm female
  josh: "TxGEqnHWrfWFTfGW9XjX", // Authoritative male
};
