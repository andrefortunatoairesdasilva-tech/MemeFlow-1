import { useState, useRef } from 'react'
import { X, Upload, Link as LinkIcon, Video, Image, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { postsService } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface CreatePostModalProps {
  onClose: () => void
  onSuccess?: () => void
  editPost?: import('@/lib/supabase').Post
}

const CATEGORIES = [
  { value: 'random', label: 'Aleatório' },
  { value: 'reacao', label: 'Reação' },
  { value: 'dark', label: 'Dark Humor' },
  { value: 'wholesome', label: 'Wholesome' },
  { value: 'absurdo', label: 'Absurdo' },
  { value: 'politica', label: 'Política' },
  { value: 'games', label: 'Games' },
  { value: 'anime', label: 'Anime' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Publicado' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'archived', label: 'Arquivado' },
]

export default function CreatePostModal({ onClose, onSuccess, editPost }: CreatePostModalProps) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: editPost?.title ?? '',
    description: editPost?.description ?? '',
    category: editPost?.category ?? 'random',
    video_url: editPost?.video_url ?? '',
    thumbnail_url: editPost?.thumbnail_url ?? '',
    status: editPost?.status ?? 'active',
  })
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.title.trim()) return toast.error('Título obrigatório')
    if (!form.description.trim()) return toast.error('Descrição obrigatória')
    if (!form.video_url && !videoFile) return toast.error('Adicione um vídeo')

    setLoading(true)

    try {
      let video_url = form.video_url
      let video_storage_path = editPost?.video_storage_path ?? null
      let thumbnail_url = form.thumbnail_url
      let thumbnail_storage_path = editPost?.thumbnail_storage_path ?? null

      // Upload video file if provided
      if (videoFile) {
        const { data, error, path } = await postsService.uploadVideo(user.id, videoFile, setUploadProgress)
        if (error) throw new Error('Erro ao enviar vídeo: ' + error.message)
        video_url = data?.publicUrl ?? ''
        video_storage_path = path
      }

      // Upload thumbnail if provided
      if (thumbFile) {
        const { data, error, path } = await postsService.uploadThumbnail(user.id, thumbFile)
        if (error) throw new Error('Erro ao enviar thumbnail: ' + error.message)
        thumbnail_url = data?.publicUrl ?? ''
        thumbnail_storage_path = path
      }

      const postData = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        video_url,
        video_storage_path,
        thumbnail_url: thumbnail_url || null,
        thumbnail_storage_path,
        status: form.status as 'active' | 'draft' | 'archived',
      }

      let error
      if (editPost) {
        const result = await postsService.update(editPost.id, postData)
        error = result.error
      } else {
        const result = await postsService.create(postData)
        error = result.error
      }

      if (error) throw new Error(error.message)

      toast.success(editPost ? 'Post atualizado!' : 'Meme publicado!')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {editPost ? 'Editar Post' : 'Novo Meme'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              placeholder="Nome do meme épico"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Textarea
              placeholder="Contexto do meme, créditos, etc..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video */}
          <div className="space-y-2">
            <Label>Vídeo *</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVideoMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  videoMode === 'url'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  videoMode === 'upload'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>

            {videoMode === 'url' ? (
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="url"
                  placeholder="https://exemplo.com/video.mp4"
                  value={form.video_url}
                  onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                  className="pl-10"
                />
              </div>
            ) : (
              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {videoFile ? videoFile.name : 'Clique para selecionar vídeo (MP4, WebM)'}
                  </span>
                  {videoFile && <span className="text-xs text-purple-500">{(videoFile.size / 1024 / 1024).toFixed(1)}MB</span>}
                </button>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}% enviado</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail (opcional)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="url"
                  placeholder="URL da imagem de capa"
                  value={form.thumbnail_url}
                  onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={e => setThumbFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-all"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
            {thumbFile && (
              <p className="text-xs text-purple-500">Arquivo: {thumbFile.name}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as 'active' | 'draft' | 'archived' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" className="flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress > 0 ? `${uploadProgress}%` : 'Publicando...'}
                </span>
              ) : (
                editPost ? 'Salvar Alterações' : 'Publicar Meme'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
