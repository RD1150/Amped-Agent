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

/**
 * Add a voice clone to ElevenLabs using an audio sample URL
 * Returns the new voice_id for use in text-to-speech
 */
export async function cloneVoice(options: {
  name: string;
  audioUrl: string; // Public URL to audio file (MP3/WAV/M4A, 15s–5min recommended)
  description?: string;
}): Promise<{ voice_id: string; name: string }> {
  const { name, audioUrl, description } = options;

  // Download the audio file from the URL
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio sample: ${audioResponse.status}`);
  }
  const audioBuffer = await audioResponse.arrayBuffer();

  // Determine file extension from URL
  const ext = audioUrl.split("?")[0].split(".").pop()?.toLowerCase() || "mp3";
  const mimeType = ext === "wav" ? "audio/wav" : ext === "m4a" ? "audio/mp4" : "audio/mpeg";

  // Build multipart form data
  const formData = new FormData();
  formData.append("name", name);
  if (description) formData.append("description", description);
  formData.append(
    "files",
    new Blob([audioBuffer], { type: mimeType }),
    `voice-sample.${ext}`
  );

  const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
    method: "POST",
    headers: {
      "xi-api-key": ENV.ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs voice clone error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return { voice_id: data.voice_id, name };
}

/**
 * Delete a cloned voice from ElevenLabs (cleanup)
 */
export async function deleteVoice(voice_id: string): Promise<void> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voice_id}`, {
    method: "DELETE",
    headers: {
      "xi-api-key": ENV.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.warn(`ElevenLabs delete voice warning: ${response.status} - ${error}`);
  }
}

/**
 * Get details of a specific voice
 */
export async function getVoice(voice_id: string): Promise<VoiceOption | null> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voice_id}`, {
    headers: {
      "xi-api-key": ENV.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) return null;

  const v = await response.json();
  return {
    voice_id: v.voice_id,
    name: v.name,
    description: v.description || "",
  };
}
