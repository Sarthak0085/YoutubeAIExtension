import { createContext, useContext, useEffect, useState } from "react"

import { usePort } from "@plasmohq/messaging/hook"

import { models, prompts } from "../lib/constants"
import type { Model, Prompt } from "../lib/types"
import { useExtension } from "./extension-context"

interface SummaryContextProps {
  summaryModel: Model
  setSummaryModel: (model: Model) => void
  summaryPrompt: Prompt
  setSummaryPrompt: (prompt: Prompt) => void
  summaryContent: string | null
  setSummaryContent: (content: string | null) => void
  summaryIsError: boolean
  setSummaryIsError: (isError: boolean) => void
  summaryIsGenerating: boolean
  setSummaryIsGenerating: (isGenerating: boolean) => void
  generateSummary: (e: any) => void
}

const SummaryContext = createContext<SummaryContextProps | undefined>(undefined)

export function useSummary() {
  const context = useContext(SummaryContext)

  if (!context) {
    throw new Error("useSummary must be used within the summary provider")
  }

  return context
}

interface SummaryProviderProps {
  children: React.ReactNode
}

export function SummaryProvider({ children }: SummaryProviderProps) {
  const [summaryModel, setSummaryModel] = useState<Model>(models[0])
  const [summaryPrompt, setSummaryPrompt] = useState<Prompt>(prompts[0])
  const [summaryContent, setSummaryContent] = useState<string | null>(null)
  const [summaryIsError, setSummaryIsError] = useState<boolean>(false)
  const [summaryIsGenerating, setSummaryIsGenerating] = useState<boolean>(false)

  const port = usePort("completion" as never)

  const { extensionData, extensionLoading } = useExtension()

  async function generateSummary(e: any) {
    e.preventDefault()

    if (summaryContent !== null) {
      setSummaryContent(null)
    }

    setSummaryIsError(false)
    setSummaryIsGenerating(true)
    port.send({
      prompt: summaryPrompt.content,
      model: summaryModel.content,
      context: extensionData
    })
  }

  useEffect(() => {
    setSummaryContent(null)
    setSummaryIsError(false)
    setSummaryIsGenerating(false)
  }, [extensionLoading])

  useEffect(() => {
    if (port.data?.message !== undefined && port.data.isEnd === false) {
      setSummaryContent(port.data?.message)
    } else {
      setSummaryIsGenerating(false)
    }
    setSummaryIsError(false)
  }, [port.data?.message])

  useEffect(() => {
    if (port.data?.error !== undefined && port.data?.error !== null) {
      setSummaryContent(null)
      setSummaryIsError(true)
    } else {
      setSummaryIsError(false)
    }
  }, [port.data?.error])

  const value = {
    summaryModel,
    summaryContent,
    summaryIsError,
    summaryIsGenerating,
    summaryPrompt,
    setSummaryContent,
    setSummaryIsError,
    setSummaryIsGenerating,
    setSummaryModel,
    setSummaryPrompt,
    generateSummary
  }

  return (
    <SummaryContext.Provider value={value}>{children}</SummaryContext.Provider>
  )
}
