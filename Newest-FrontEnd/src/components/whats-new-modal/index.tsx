"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageIcon, MessageSquare, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useIsClient } from "@/hooks/useIsClient"
import { Button } from "../ui/button"

const STORAGE_KEY = "whats-new-seen-v1"

export function WhatsNewModal() {
  const router = useRouter()
  const isClient = useIsClient()
  const [dismissed, setDismissed] = useState(false)
  // Abre uma vez por navegador (o localStorage só existe no cliente).
  const open = isClient && !dismissed && !localStorage.getItem(STORAGE_KEY)

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "true")
    setDismissed(true)
  }

  function handleSeeAll() {
    handleClose()
    router.push("/update")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">🎉 Novidades no Newest</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Verificação de imagem</p>
              <p className="text-sm text-muted-foreground">Imagens com conteúdo explícito são bloqueadas automaticamente.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Menções a usuários</p>
              <p className="text-sm text-muted-foreground">Digite @ seguido do nome para mencionar alguém em posts e comentários.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Até 3 imagens por post</p>
              <p className="text-sm text-muted-foreground">Agora você pode adicionar até 3 imagens em cada post.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Fechar
          </Button>
          <Button className="flex-1" onClick={handleSeeAll}>
            Ver todas as novidades
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}