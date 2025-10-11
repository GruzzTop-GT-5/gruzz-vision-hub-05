import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { REQUIRED_AGREEMENTS, TERMS_VERSION, PLATFORM_RULES } from '@/data/legal';

interface TermsAcceptanceProps {
  onAccept: (agreements: Record<string, boolean>) => void;
  onCancel?: () => void;
  isOpen: boolean;
}

interface DocumentViewerProps {
  title: string;
  content: any;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  title, 
  content, 
  isOpen, 
  onClose 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:duration-0 data-[state=closed]:duration-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Подробная информация о правилах и условиях
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full">
          <div className="space-y-6 pr-4">
            {content?.content?.map((section: any, index: number) => (
              <div key={index}>
                <h4 className="font-semibold text-foreground mb-3">
                  {section.section}
                </h4>
                <ul className="space-y-2">
                  {section.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                {index < content.content.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export const TermsAcceptance: React.FC<TermsAcceptanceProps> = ({ 
  onAccept, 
  onCancel, 
  isOpen 
}) => {
  const [acceptAll, setAcceptAll] = useState(false);
  const [showDocument, setShowDocument] = useState<string | null>(null);
  const { toast } = useToast();

  const getDocumentContent = (agreementId: string) => {
    switch (agreementId) {
      case 'terms_of_service':
        return PLATFORM_RULES.responsibilities;
      case 'privacy_policy':
        return PLATFORM_RULES.privacy;
      case 'commission_agreement':
        return PLATFORM_RULES.commission;
      default:
        return PLATFORM_RULES.responsibilities;
    }
  };

  const getDocumentTitle = (agreementId: string) => {
    const agreement = REQUIRED_AGREEMENTS.find(a => a.id === agreementId);
    return agreement?.title || 'Документ';
  };

  const handleAccept = () => {
    if (!acceptAll) {
      toast({
        title: "Необходимо согласие",
        description: "Пожалуйста, примите все соглашения",
        variant: "destructive"
      });
      return;
    }

    // Создаем объект со всеми соглашениями
    const agreements: Record<string, boolean> = {};
    REQUIRED_AGREEMENTS.forEach(agreement => {
      agreements[agreement.id] = true;
    });

    onAccept(agreements);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onCancel?.()}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span>Соглашения платформы GruzzTop</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Для использования платформы необходимо ознакомиться и принять следующие соглашения
            </DialogDescription>
          </DialogHeader>

          <div className="mb-3">
            <Badge variant="outline" className="text-xs">Версия {TERMS_VERSION}</Badge>
          </div>

          <ScrollArea className="h-[45vh] sm:h-[40vh] w-full pr-2">
            <div className="space-y-3">
              {REQUIRED_AGREEMENTS.map((agreement) => (
                <Card key={agreement.id} className="border-steel-600 bg-steel-800/50">
                  <CardHeader className="p-3 sm:p-4 pb-2">
                    <CardTitle className="text-sm sm:text-base flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">{agreement.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDocument(agreement.id)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {agreement.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          {/* Одна галочка для всех соглашений */}
          <div className="bg-steel-800/30 border border-steel-600 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept-all"
                checked={acceptAll}
                onCheckedChange={(checked) => setAcceptAll(checked as boolean)}
                className="mt-0.5 flex-shrink-0"
              />
              <label
                htmlFor="accept-all"
                className="text-sm sm:text-base cursor-pointer leading-tight"
              >
                Я ознакомился(ась) и согласен(на) со всеми условиями использования платформы, политикой конфиденциальности и соглашением о комиссиях
              </label>
            </div>
          </div>

          {!acceptAll && (
            <p className="text-xs sm:text-sm text-red-400 text-center">
              Необходимо принять все обязательные соглашения
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 text-sm sm:text-base"
            >
              Отмена
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!acceptAll}
              className="flex-1 text-sm sm:text-base"
            >
              Принимаю условия
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      {showDocument && (
        <DocumentViewer
          title={getDocumentTitle(showDocument)}
          content={getDocumentContent(showDocument)}
          isOpen={!!showDocument}
          onClose={() => setShowDocument(null)}
        />
      )}
    </>
  );
};