import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { OpenAIAtlasModel } from "@/lib/model/providers/openai/adapter";
import type { AtlasModel, ModelRole } from "@/lib/model/types";

export function modelFor(role: ModelRole): AtlasModel {
  const env = getServerEnv();
  const modelId =
    role === "conversation"
      ? env.ATLAS_CONVERSATION_MODEL
      : env.ATLAS_BACKGROUND_MODEL;
  return new OpenAIAtlasModel(env.OPENAI_API_KEY, modelId);
}
