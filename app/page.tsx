'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HiOutlineDocumentText, HiOutlineCloudArrowUp, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineMagnifyingGlass, HiOutlineArrowDownTray, HiOutlineShieldCheck, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineArrowPath, HiOutlineEnvelope } from 'react-icons/hi2'
import { HiOutlineClipboardCheck } from 'react-icons/hi'
import { TbCertificate } from 'react-icons/tb'

// --- Constants ---
const AGENT_ID = '69996d91cf2aa167c0547540'
const ITEMS_PER_PAGE = 10

// --- Interfaces ---
interface IssuanceRecord {
  certificate_id: string
  name: string
  email: string
  event: string
  date: string
  status: 'success' | 'failed' | 'pending'
  appreciation_message: string
  timestamp: string
  retries: number
  email_sent_to: string
}

interface FormData {
  name: string
  email: string
  event: string
  date: string
}

// --- Sample data ---
const SAMPLE_RECORDS: IssuanceRecord[] = [
  {
    certificate_id: 'CERT-2026-001',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    event: 'AI Innovation Hackathon 2026',
    date: '2026-02-15',
    status: 'success',
    appreciation_message: 'We proudly recognize Alice Johnson for her outstanding participation in the AI Innovation Hackathon 2026. Her dedication and innovative contributions have exemplified the spirit of excellence that defines this event.',
    timestamp: '2026-02-15T10:30:00.000Z',
    retries: 0,
    email_sent_to: 'alice.johnson@example.com',
  },
  {
    certificate_id: 'CERT-2026-002',
    name: 'Bob Martinez',
    email: 'bob.martinez@example.com',
    event: 'Cloud Architecture Summit',
    date: '2026-02-16',
    status: 'success',
    appreciation_message: 'It is with great pleasure that we honor Bob Martinez for his remarkable engagement in the Cloud Architecture Summit. His insightful contributions and commitment to learning have left a lasting impression on all attendees.',
    timestamp: '2026-02-16T14:22:00.000Z',
    retries: 0,
    email_sent_to: 'bob.martinez@example.com',
  },
  {
    certificate_id: 'CERT-2026-003',
    name: 'Clara Nguyen',
    email: 'clara.nguyen@example.com',
    event: 'Data Science Bootcamp',
    date: '2026-02-17',
    status: 'failed',
    appreciation_message: 'Network error during generation',
    timestamp: '2026-02-17T09:15:00.000Z',
    retries: 2,
    email_sent_to: '',
  },
  {
    certificate_id: 'CERT-2026-004',
    name: 'David Chen',
    email: 'david.chen@example.com',
    event: 'Full Stack Development Workshop',
    date: '2026-02-18',
    status: 'success',
    appreciation_message: 'We extend our heartfelt appreciation to David Chen for his exemplary performance in the Full Stack Development Workshop. His passion for technology and collaborative spirit have truly set him apart.',
    timestamp: '2026-02-18T11:45:00.000Z',
    retries: 0,
    email_sent_to: 'david.chen@example.com',
  },
  {
    certificate_id: 'CERT-2026-005',
    name: 'Eva Rossi',
    email: 'eva.rossi@example.com',
    event: 'UX Design Masterclass',
    date: '2026-02-19',
    status: 'pending',
    appreciation_message: '',
    timestamp: '2026-02-19T16:00:00.000Z',
    retries: 0,
    email_sent_to: '',
  },
]

// --- Markdown renderer ---
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Helper: Email validation ---
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// --- Helper: Today's date in YYYY-MM-DD ---
function getTodayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// --- Helper: Format timestamp ---
function formatTimestamp(ts: string): string {
  if (!ts) return '--'
  try {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

// --- Helper: Generate CSV template ---
function downloadCSVTemplate() {
  const csvContent = 'name,email,event\nJohn Smith,john@example.com,AI Workshop 2026\nJane Doe,jane@example.com,Cloud Summit 2026\n'
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'certificate_template.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Helper: Export records as CSV ---
function exportRecordsCSV(records: IssuanceRecord[]) {
  if (!Array.isArray(records) || records.length === 0) return
  const headers = 'Certificate ID,Name,Email,Event,Date,Status,Appreciation Message,Email Sent To,Timestamp,Retries\n'
  const rows = records
    .map(
      (r) =>
        `"${r.certificate_id}","${r.name}","${r.email}","${r.event}","${r.date}","${r.status}","${(r.appreciation_message || '').replace(/"/g, '""')}","${r.email_sent_to || ''}","${r.timestamp}","${r.retries}"`
    )
    .join('\n')
  const blob = new Blob([headers + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'certiflow_export.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- Status Badge component ---
function StatusBadge({ status }: { status: string }) {
  if (status === 'success') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1">
        <HiOutlineCheckCircle className="w-3.5 h-3.5" />
        Success
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1">
        <HiOutlineXCircle className="w-3.5 h-3.5" />
        Failed
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 gap-1">
      <HiOutlineClock className="w-3.5 h-3.5" />
      Pending
    </Badge>
  )
}

// --- Stat Card component ---
function StatCard({
  title,
  value,
  total,
  icon,
  color,
}: {
  title: string
  value: number
  total: number
  icon: React.ReactNode
  color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`p-2 rounded-xl ${color}`}>{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

// --- Agent Info component ---
function AgentInfoSection({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-sm mt-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${activeAgentId ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
            <span className="text-xs font-medium text-foreground">Certificate Message Agent</span>
          </div>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <span className="text-xs text-muted-foreground font-mono">{AGENT_ID}</span>
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <span className="text-xs text-muted-foreground">Generates VeloDB & Lyzr branded certificates and emails them to participants</span>
          {activeAgentId && (
            <>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <HiOutlineArrowPath className="w-3 h-3 animate-spin" />
                Processing...
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function Page() {
  // --- State ---
  const [activeTab, setActiveTab] = useState('submit')
  const [showSampleData, setShowSampleData] = useState(false)
  const [records, setRecords] = useState<IssuanceRecord[]>([])
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', event: '', date: '' })
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [lastIssuedRecord, setLastIssuedRecord] = useState<IssuanceRecord | null>(null)

  // Dashboard state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Verification state
  const [verifyId, setVerifyId] = useState('')
  const [verifyResult, setVerifyResult] = useState<IssuanceRecord | null>(null)
  const [verifyNotFound, setVerifyNotFound] = useState(false)

  // Bulk upload state
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkTotal, setBulkTotal] = useState(0)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Certificate ID counter
  const certCounterRef = useRef(0)

  // Init today's date
  const [todayDate, setTodayDate] = useState('')
  useEffect(() => {
    setTodayDate(getTodayString())
  }, [])

  // Set default date when todayDate is available
  useEffect(() => {
    if (todayDate && !formData.date) {
      setFormData((prev) => ({ ...prev, date: todayDate }))
    }
  }, [todayDate])

  // Compute displayed records (real or sample)
  const displayRecords = showSampleData && records.length === 0 ? SAMPLE_RECORDS : records

  // --- Certificate ID generator ---
  const generateCertificateId = useCallback(() => {
    certCounterRef.current += 1
    const year = new Date().getFullYear()
    return `CERT-${year}-${String(certCounterRef.current).padStart(3, '0')}`
  }, [])

  // --- Form validation ---
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.name.trim()) errors.name = 'Full name is required'
    if (!formData.email.trim()) errors.email = 'Email address is required'
    else if (!isValidEmail(formData.email.trim())) errors.email = 'Please enter a valid email address'
    if (!formData.event.trim()) errors.event = 'Event name is required'
    if (!formData.date) errors.date = 'Date is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // --- Duplicate check ---
  const isDuplicate = useCallback(
    (name: string, email: string, event: string): boolean => {
      return records.some(
        (r) =>
          r.name.toLowerCase() === name.toLowerCase() &&
          r.email.toLowerCase() === email.toLowerCase() &&
          r.event.toLowerCase() === event.toLowerCase()
      )
    },
    [records]
  )

  // --- Process a single submission ---
  const processSubmission = useCallback(
    async (name: string, email: string, event: string, date: string): Promise<IssuanceRecord> => {
      const certId = generateCertificateId()
      const record: IssuanceRecord = {
        certificate_id: certId,
        name,
        email,
        event,
        date,
        status: 'pending',
        appreciation_message: '',
        timestamp: new Date().toISOString(),
        retries: 0,
        email_sent_to: '',
      }

      try {
        setActiveAgentId(AGENT_ID)
        const result = await callAIAgent(
          `Generate a personalized, formal appreciation message (under 60 words) for participant "${name}" who completed the event "${event}" on ${date}. Certificate ID: ${certId}. Then send a VeloDB & Lyzr branded certificate email to their email address: ${email}. The email subject should be "Your VeloDB & Lyzr Certificate - ${event}". Include the participant name, event name, date, certificate ID, and appreciation message in the email body.`,
          AGENT_ID
        )

        if (result.success) {
          const agentResult = result?.response?.result || {}
          record.appreciation_message =
            agentResult?.appreciation_message ||
            result?.response?.message ||
            'Certificate of appreciation generated successfully.'
          record.email_sent_to = agentResult?.email_sent_to || email
          record.status = 'success'
        } else {
          record.status = 'failed'
          record.appreciation_message = result?.error || 'Failed to generate appreciation message'
        }
      } catch (err) {
        record.status = 'failed'
        record.appreciation_message = 'Network error during certificate generation'
      } finally {
        setActiveAgentId(null)
      }

      return record
    },
    [generateCertificateId]
  )

  // --- Handle form submit ---
  const handleSubmit = useCallback(async () => {
    setSubmitMessage(null)
    if (!validateForm()) return

    const { name, email, event, date } = formData

    if (isDuplicate(name.trim(), email.trim(), event.trim())) {
      setSubmitMessage({
        type: 'error',
        text: `A certificate has already been issued for ${name.trim()} for the event "${event.trim()}".`,
      })
      return
    }

    setIsSubmitting(true)
    const record = await processSubmission(name.trim(), email.trim(), event.trim(), date)
    setRecords((prev) => [record, ...prev])

    if (record.status === 'success') {
      setSubmitMessage({
        type: 'success',
        text: `VeloDB & Lyzr Certificate ${record.certificate_id} generated and emailed to ${record.email_sent_to || record.email} for ${record.name}.`,
      })
      setLastIssuedRecord(record)
      setFormData({ name: '', email: '', event: '', date: todayDate })
      setFormErrors({})
    } else {
      setSubmitMessage({
        type: 'error',
        text: `Failed to generate certificate: ${record.appreciation_message}. You can retry from the dashboard.`,
      })
    }

    setIsSubmitting(false)
  }, [formData, validateForm, isDuplicate, processSubmission, todayDate])

  // --- Handle retry ---
  const handleRetry = useCallback(
    async (certId: string) => {
      const recordIndex = records.findIndex((r) => r.certificate_id === certId)
      if (recordIndex === -1) return
      const existing = records[recordIndex]
      if ((existing?.retries ?? 0) >= 3) return

      setRecords((prev) =>
        prev.map((r) => (r.certificate_id === certId ? { ...r, status: 'pending' as const } : r))
      )

      try {
        setActiveAgentId(AGENT_ID)
        const result = await callAIAgent(
          `Generate a personalized, formal appreciation message (under 60 words) for participant "${existing.name}" who completed the event "${existing.event}" on ${existing.date}. Certificate ID: ${existing.certificate_id}. Then send a VeloDB & Lyzr branded certificate email to their email address: ${existing.email}. The email subject should be "Your VeloDB & Lyzr Certificate - ${existing.event}". Include the participant name, event name, date, certificate ID, and appreciation message in the email body.`,
          AGENT_ID
        )

        if (result.success) {
          const agentResult = result?.response?.result || {}
          setRecords((prev) =>
            prev.map((r) =>
              r.certificate_id === certId
                ? {
                    ...r,
                    status: 'success' as const,
                    appreciation_message:
                      agentResult?.appreciation_message ||
                      result?.response?.message ||
                      'Certificate of appreciation generated successfully.',
                    email_sent_to: agentResult?.email_sent_to || existing.email,
                    retries: r.retries + 1,
                  }
                : r
            )
          )
        } else {
          setRecords((prev) =>
            prev.map((r) =>
              r.certificate_id === certId
                ? {
                    ...r,
                    status: 'failed' as const,
                    appreciation_message: result?.error || 'Retry failed',
                    retries: r.retries + 1,
                  }
                : r
            )
          )
        }
      } catch {
        setRecords((prev) =>
          prev.map((r) =>
            r.certificate_id === certId
              ? {
                  ...r,
                  status: 'failed' as const,
                  appreciation_message: 'Network error on retry',
                  retries: r.retries + 1,
                }
              : r
          )
        )
      } finally {
        setActiveAgentId(null)
      }
    },
    [records]
  )

  // --- CSV parsing & bulk upload ---
  const parseCSV = useCallback((text: string): Array<{ name: string; email: string; event: string }> => {
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) return []

    const headerCols = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const nameIdx = headerCols.indexOf('name')
    const emailIdx = headerCols.indexOf('email')
    const eventIdx = headerCols.indexOf('event')

    if (nameIdx === -1 || emailIdx === -1 || eventIdx === -1) return []

    const rows: Array<{ name: string; email: string; event: string }> = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      const name = cols[nameIdx] || ''
      const email = cols[emailIdx] || ''
      const event = cols[eventIdx] || ''
      if (name && email && event && isValidEmail(email)) {
        rows.push({ name, email, event })
      }
    }
    return rows
  }, [])

  const handleBulkUpload = useCallback(async () => {
    if (!bulkFile) return
    setBulkMessage(null)
    setBulkProcessing(true)
    setBulkProgress(0)

    const text = await bulkFile.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      setBulkMessage({ type: 'error', text: 'No valid rows found. Ensure CSV has name, email, event columns.' })
      setBulkProcessing(false)
      return
    }

    setBulkTotal(rows.length)
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (isDuplicate(row.name, row.email, row.event)) {
        failCount++
        setBulkProgress(i + 1)
        continue
      }

      const record = await processSubmission(row.name, row.email, row.event, todayDate)
      setRecords((prev) => [record, ...prev])

      if (record.status === 'success') {
        successCount++
      } else {
        failCount++
      }
      setBulkProgress(i + 1)
    }

    setBulkMessage({
      type: successCount > 0 ? 'success' : 'error',
      text: `Bulk processing complete: ${successCount} succeeded, ${failCount} failed/skipped out of ${rows.length} total.`,
    })
    setBulkProcessing(false)
    setBulkFile(null)
  }, [bulkFile, parseCSV, isDuplicate, processSubmission, todayDate])

  // --- Drag & drop handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].name.endsWith('.csv')) {
      setBulkFile(files[0])
      setBulkMessage(null)
    } else {
      setBulkMessage({ type: 'error', text: 'Please upload a .csv file.' })
    }
  }, [])

  // --- Dashboard filtering ---
  const filteredRecords = displayRecords.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.certificate_id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE))
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // --- Dashboard stats ---
  const totalIssued = displayRecords.length
  const successCount = displayRecords.filter((r) => r.status === 'success').length
  const failedCount = displayRecords.filter((r) => r.status === 'failed').length
  const pendingCount = displayRecords.filter((r) => r.status === 'pending').length

  // --- Verification ---
  const handleVerify = useCallback(() => {
    setVerifyResult(null)
    setVerifyNotFound(false)
    if (!verifyId.trim()) return

    const found = displayRecords.find(
      (r) => r.certificate_id.toLowerCase() === verifyId.trim().toLowerCase()
    )
    if (found) {
      setVerifyResult(found)
    } else {
      setVerifyNotFound(true)
    }
  }, [verifyId, displayRecords])

  // --- Sample data toggle ---
  useEffect(() => {
    if (showSampleData && records.length === 0) {
      certCounterRef.current = 5
    }
  }, [showSampleData, records.length])

  return (
    <ErrorBoundary>
      <div
        className="min-h-screen text-foreground font-sans"
        style={{
          background: 'linear-gradient(135deg, hsl(160 40% 94%) 0%, hsl(180 35% 93%) 30%, hsl(160 35% 95%) 60%, hsl(140 40% 94%) 100%)',
          letterSpacing: '-0.01em',
          lineHeight: '1.55',
        }}
      >
        {/* --- Navigation Header --- */}
        <nav className="sticky top-0 z-50 backdrop-blur-[16px] bg-white/75 border-b border-white/[0.18] shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TbCertificate className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">CertiFlow AI</h1>
                <p className="text-xs text-muted-foreground">Automated Certificate Generation & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={showSampleData}
                onCheckedChange={setShowSampleData}
              />
            </div>
          </div>
        </nav>

        {/* --- Main Content --- */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start bg-white/60 backdrop-blur-[8px] border border-white/[0.18] p-1 rounded-xl mb-6">
              <TabsTrigger value="submit" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <HiOutlineDocumentText className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Certificates</span>
                <span className="sm:hidden">Submit</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <HiOutlineClipboardCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Issuance Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="verify" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <HiOutlineShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Verify Certificate</span>
                <span className="sm:hidden">Verify</span>
              </TabsTrigger>
            </TabsList>

            {/* ================================================================ */}
            {/* TAB 1: CERTIFICATE SUBMISSION */}
            {/* ================================================================ */}
            <TabsContent value="submit" className="space-y-6">
              <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl tracking-tight flex items-center gap-2">
                    <HiOutlineDocumentText className="w-5 h-5 text-primary" />
                    Issue New Certificate
                  </CardTitle>
                  <CardDescription>
                    Fill in the participant details below. The AI agent will generate a personalized VeloDB & Lyzr branded certificate with an appreciation message and email it directly to the participant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g. Alice Johnson"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }))
                        }}
                        className={formErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g. alice@example.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        className={formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                    </div>

                    {/* Event Name */}
                    <div className="space-y-2">
                      <Label htmlFor="event" className="text-sm font-medium">
                        Event Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="event"
                        placeholder="e.g. AI Innovation Hackathon 2026"
                        value={formData.event}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, event: e.target.value }))
                          if (formErrors.event) setFormErrors((prev) => ({ ...prev, event: undefined }))
                        }}
                        className={formErrors.event ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {formErrors.event && <p className="text-xs text-destructive">{formErrors.event}</p>}
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm font-medium">
                        Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, date: e.target.value }))
                          if (formErrors.date) setFormErrors((prev) => ({ ...prev, date: undefined }))
                        }}
                        className={formErrors.date ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {formErrors.date && <p className="text-xs text-destructive">{formErrors.date}</p>}
                    </div>
                  </div>

                  {/* Submit message */}
                  {submitMessage && (
                    <div
                      className={`flex items-start gap-3 p-4 rounded-xl text-sm ${submitMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
                    >
                      {submitMessage.type === 'success' ? (
                        <HiOutlineCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                      ) : (
                        <HiOutlineXCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                      )}
                      <span>{submitMessage.text}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full md:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-11 px-8 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                        Generating & Emailing Certificate...
                      </>
                    ) : (
                      <>
                        <TbCertificate className="w-4 h-4" />
                        Generate & Email VeloDB & Lyzr Certificate
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* --- VeloDB & Lyzr Certificate Preview --- */}
              {lastIssuedRecord && lastIssuedRecord.status === 'success' && (
                <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-xl overflow-hidden">
                  <div className="relative">
                    {/* Certificate Header Band */}
                    <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-5 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TbCertificate className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold tracking-tight">VeloDB & Lyzr</h3>
                            <p className="text-emerald-100 text-xs">Certificate of Appreciation</p>
                          </div>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20 gap-1.5 backdrop-blur-sm">
                          <HiOutlineEnvelope className="w-3.5 h-3.5" />
                          Email Sent
                        </Badge>
                      </div>
                    </div>

                    {/* Certificate Body */}
                    <CardContent className="p-6 space-y-5">
                      <div className="text-center py-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">This is to certify that</p>
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground font-serif">{lastIssuedRecord.name}</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                          has successfully participated in
                        </p>
                        <p className="text-lg font-medium text-primary mt-1">{lastIssuedRecord.event}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          on {new Date(lastIssuedRecord.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>

                      <Separator />

                      {/* Appreciation Message */}
                      {lastIssuedRecord.appreciation_message && (
                        <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
                          <p className="text-sm text-foreground leading-relaxed italic text-center">
                            &ldquo;{lastIssuedRecord.appreciation_message}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Certificate Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Certificate ID</p>
                          <p className="font-mono text-sm font-semibold text-primary">{lastIssuedRecord.certificate_id}</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Emailed To</p>
                          <p className="text-sm font-medium text-foreground truncate">{lastIssuedRecord.email_sent_to || lastIssuedRecord.email}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[10px] text-muted-foreground">
                          Issued by VeloDB in partnership with Lyzr
                        </p>
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1 text-[10px] px-2 py-0.5">
                          <HiOutlineShieldCheck className="w-3 h-3" />
                          Verified
                        </Badge>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )}

              {/* --- Bulk Upload Section --- */}
              <Collapsible open={bulkOpen} onOpenChange={setBulkOpen}>
                <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-lg">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/40 transition-colors rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HiOutlineCloudArrowUp className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base tracking-tight">Bulk Upload</CardTitle>
                          <Badge variant="secondary" className="text-xs">CSV</Badge>
                        </div>
                        {bulkOpen ? (
                          <HiOutlineChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <HiOutlineChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      <p className="text-sm text-muted-foreground">
                        Upload a CSV file with columns: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">name</span>, <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">email</span>, <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">event</span>. Each row will be processed sequentially.
                      </p>

                      <button
                        type="button"
                        onClick={downloadCSVTemplate}
                        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 flex items-center gap-1.5"
                      >
                        <HiOutlineArrowDownTray className="w-4 h-4" />
                        Download CSV Template
                      </button>

                      {/* Drop zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                      >
                        <HiOutlineCloudArrowUp className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag & drop your CSV file here, or click to browse
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setBulkFile(file)
                              setBulkMessage(null)
                            }
                          }}
                        />
                        {bulkFile && (
                          <Badge variant="secondary" className="mt-2 gap-1">
                            <HiOutlineDocumentText className="w-3 h-3" />
                            {bulkFile.name}
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      {bulkProcessing && bulkTotal > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Processing certificates...</span>
                            <span>{bulkProgress} of {bulkTotal}</span>
                          </div>
                          <Progress value={(bulkProgress / bulkTotal) * 100} className="h-2" />
                        </div>
                      )}

                      {/* Bulk message */}
                      {bulkMessage && (
                        <div
                          className={`flex items-start gap-3 p-4 rounded-xl text-sm ${bulkMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
                        >
                          {bulkMessage.type === 'success' ? (
                            <HiOutlineCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
                          ) : (
                            <HiOutlineXCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                          )}
                          <span>{bulkMessage.text}</span>
                        </div>
                      )}

                      <Button
                        onClick={handleBulkUpload}
                        disabled={!bulkFile || bulkProcessing}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                      >
                        {bulkProcessing ? (
                          <>
                            <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <HiOutlineCloudArrowUp className="w-4 h-4" />
                            Process CSV
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </TabsContent>

            {/* ================================================================ */}
            {/* TAB 2: ISSUANCE DASHBOARD */}
            {/* ================================================================ */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total Issued"
                  value={totalIssued}
                  total={Math.max(totalIssued, 1)}
                  icon={<TbCertificate className="w-5 h-5 text-primary" />}
                  color="bg-primary/10"
                />
                <StatCard
                  title="Successful"
                  value={successCount}
                  total={totalIssued}
                  icon={<HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />}
                  color="bg-emerald-50"
                />
                <StatCard
                  title="Failed"
                  value={failedCount}
                  total={totalIssued}
                  icon={<HiOutlineXCircle className="w-5 h-5 text-red-500" />}
                  color="bg-red-50"
                />
                <StatCard
                  title="Pending"
                  value={pendingCount}
                  total={totalIssued}
                  icon={<HiOutlineClock className="w-5 h-5 text-amber-500" />}
                  color="bg-amber-50"
                />
              </div>

              {/* Filters */}
              <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-lg">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, event, or certificate ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => exportRecordsCSV(displayRecords)}
                      disabled={displayRecords.length === 0}
                      className="gap-2 rounded-xl"
                    >
                      <HiOutlineArrowDownTray className="w-4 h-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Table */}
              <Card className="backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-lg overflow-hidden">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold text-xs">Certificate ID</TableHead>
                        <TableHead className="font-semibold text-xs">Participant Name</TableHead>
                        <TableHead className="font-semibold text-xs hidden md:table-cell">Email</TableHead>
                        <TableHead className="font-semibold text-xs">Event</TableHead>
                        <TableHead className="font-semibold text-xs">Status</TableHead>
                        <TableHead className="font-semibold text-xs hidden lg:table-cell">Timestamp</TableHead>
                        <TableHead className="font-semibold text-xs w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center gap-3">
                              <TbCertificate className="w-10 h-10 text-muted-foreground/40" />
                              <div>
                                <p className="font-medium text-sm">No certificates found</p>
                                <p className="text-xs mt-1">
                                  {records.length === 0 && !showSampleData
                                    ? 'Issue your first certificate from the Submit tab, or enable Sample Data to preview.'
                                    : 'No records match your current filters.'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRecords.map((record) => (
                          <React.Fragment key={record.certificate_id}>
                            <TableRow
                              className="cursor-pointer hover:bg-white/50 transition-colors"
                              onClick={() =>
                                setExpandedRow(
                                  expandedRow === record.certificate_id ? null : record.certificate_id
                                )
                              }
                            >
                              <TableCell className="font-mono text-xs font-medium text-primary">
                                {record.certificate_id}
                              </TableCell>
                              <TableCell className="text-sm font-medium">{record.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{record.email}</TableCell>
                              <TableCell className="text-sm">{record.event}</TableCell>
                              <TableCell>
                                <StatusBadge status={record.status} />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                                {formatTimestamp(record.timestamp)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {record.status === 'failed' && record.retries < 3 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRetry(record.certificate_id)
                                      }}
                                      title="Retry"
                                    >
                                      <HiOutlineArrowPath className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  <button
                                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedRow(
                                        expandedRow === record.certificate_id ? null : record.certificate_id
                                      )
                                    }}
                                  >
                                    {expandedRow === record.certificate_id ? (
                                      <HiOutlineChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                                    ) : (
                                      <HiOutlineChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedRow === record.certificate_id && (
                              <TableRow className="bg-muted/20 hover:bg-muted/20">
                                <TableCell colSpan={7} className="p-4">
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                        Appreciation Message
                                      </p>
                                      <div className="bg-white/60 rounded-xl p-4 border border-border/50">
                                        {record.status === 'success'
                                          ? renderMarkdown(record.appreciation_message || '')
                                          : (
                                            <p className="text-sm text-destructive">
                                              {record.appreciation_message || 'No message available'}
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                      <span>Email: {record.email}</span>
                                      <Separator orientation="vertical" className="h-3" />
                                      <span>Date: {record.date}</span>
                                      <Separator orientation="vertical" className="h-3" />
                                      {record.email_sent_to && record.status === 'success' && (
                                        <>
                                          <span className="flex items-center gap-1 text-emerald-600">
                                            <HiOutlineEnvelope className="w-3 h-3" />
                                            VeloDB & Lyzr certificate emailed to {record.email_sent_to}
                                          </span>
                                          <Separator orientation="vertical" className="h-3" />
                                        </>
                                      )}
                                      <span>Retries: {record.retries}/3</span>
                                      {record.status === 'failed' && record.retries < 3 && (
                                        <>
                                          <Separator orientation="vertical" className="h-3" />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-xs gap-1 rounded-lg"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleRetry(record.certificate_id)
                                            }}
                                          >
                                            <HiOutlineArrowPath className="w-3 h-3" />
                                            Retry
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Pagination */}
                {filteredRecords.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} of {filteredRecords.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="h-7 text-xs rounded-lg"
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          size="sm"
                          variant={page === currentPage ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(page)}
                          className="h-7 w-7 p-0 text-xs rounded-lg"
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="h-7 text-xs rounded-lg"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ================================================================ */}
            {/* TAB 3: CERTIFICATE VERIFICATION */}
            {/* ================================================================ */}
            <TabsContent value="verify">
              <div className="flex justify-center py-8">
                <Card className="w-full max-w-lg backdrop-blur-[16px] bg-white/75 border border-white/[0.18] shadow-lg">
                  <CardHeader className="text-center">
                    <div className="mx-auto p-3 bg-primary/10 rounded-2xl w-fit mb-2">
                      <HiOutlineShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl tracking-tight">Verify Certificate</CardTitle>
                    <CardDescription>
                      Enter a certificate ID to verify its authenticity and view details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. CERT-2026-001"
                        value={verifyId}
                        onChange={(e) => {
                          setVerifyId(e.target.value)
                          setVerifyResult(null)
                          setVerifyNotFound(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerify()
                        }}
                        className="font-mono"
                      />
                      <Button
                        onClick={handleVerify}
                        disabled={!verifyId.trim()}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6"
                      >
                        <HiOutlineMagnifyingGlass className="w-4 h-4" />
                        Verify
                      </Button>
                    </div>

                    {/* Verification result: found */}
                    {verifyResult && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl overflow-hidden">
                        {/* Branded header */}
                        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-5 py-3 text-white">
                          <div className="flex items-center gap-2">
                            <TbCertificate className="w-5 h-5" />
                            <span className="font-semibold text-sm">VeloDB & Lyzr Certificate</span>
                          </div>
                        </div>
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-2 mb-1">
                            <HiOutlineCheckCircle className="w-6 h-6 text-emerald-600" />
                            <span className="font-semibold text-emerald-800 text-lg">Certificate Verified</span>
                          </div>
                          <Separator className="bg-emerald-200" />
                          <div className="text-center py-2">
                            <p className="text-xs uppercase tracking-[0.15em] text-emerald-600 font-medium mb-2">This certifies that</p>
                            <p className="text-xl font-semibold text-emerald-900 font-serif">{verifyResult.name}</p>
                            <p className="text-sm text-emerald-700 mt-1">successfully participated in</p>
                            <p className="text-base font-medium text-emerald-800 mt-0.5">{verifyResult.event}</p>
                            <p className="text-sm text-emerald-700 mt-1">
                              on {new Date(verifyResult.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/70 rounded-lg p-3">
                              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-0.5">Certificate ID</p>
                              <p className="font-mono text-sm font-semibold text-emerald-900">{verifyResult.certificate_id}</p>
                            </div>
                            <div className="bg-white/70 rounded-lg p-3">
                              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-0.5">Issued By</p>
                              <p className="text-sm font-semibold text-emerald-900">VeloDB & Lyzr</p>
                            </div>
                          </div>
                          {verifyResult.status === 'success' && verifyResult.appreciation_message && (
                            <div className="bg-white/70 rounded-lg p-3 mt-2">
                              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1.5">Appreciation Message</p>
                              <p className="text-sm text-emerald-900 leading-relaxed italic">&ldquo;{verifyResult.appreciation_message}&rdquo;</p>
                            </div>
                          )}
                          <div className="flex justify-center pt-1">
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1.5 px-4 py-1.5 text-sm">
                              <HiOutlineShieldCheck className="w-4 h-4" />
                              Authenticated
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verification result: not found */}
                    {verifyNotFound && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                        <HiOutlineXCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                        <p className="font-semibold text-red-800">Certificate Not Found</p>
                        <p className="text-sm text-red-600 mt-1">
                          No certificate matching &quot;{verifyId}&quot; was found in the system. Please check the ID and try again.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* --- Agent Info --- */}
          <AgentInfoSection activeAgentId={activeAgentId} />
        </main>
      </div>
    </ErrorBoundary>
  )
}
