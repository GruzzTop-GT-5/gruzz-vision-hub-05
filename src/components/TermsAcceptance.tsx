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
      <DialogContent className="max-w-4xl max-h-[80vh]">
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
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [showDocument, setShowDocument] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAgreementChange = (agreementId: string, checked: boolean) => {
    setAgreements(prev => ({
      ...prev,
      [agreementId]: checked
    }));
  };

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

  const canProceed = REQUIRED_AGREEMENTS
    .filter(agreement => agreement.required)
    .every(agreement => agreements[agreement.id]);

  const handleAccept = () => {
    if (!canProceed) {
      toast({
        title: "Необходимо согласие",
        description: "Пожалуйста, примите все обязательные соглашения",
        variant: "destructive"
      });
      return;
    }

    onAccept(agreements);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onCancel?.()}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Соглашения платформы GruzzTop
            </DialogTitle>
            <DialogDescription>
              Для использования платформы необходимо ознакомиться и принять следующие соглашения
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Версия {TERMS_VERSION}</Badge>
            </div>
          </div>

          <ScrollArea className="h-[50vh] w-full pr-4">
            <div className="space-y-4">
              {REQUIRED_AGREEMENTS.map((agreement) => (
                <Card key={agreement.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {agreement.required && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {agreement.title}
                          {agreement.required && (
                            <Badge variant="destructive" className="text-xs">
                              Обязательно
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {agreement.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDocument(agreement.id)}
                        className="ml-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={agreement.id}
                        checked={agreements[agreement.id] || false}
                        onCheckedChange={(checked) => 
                          handleAgreementChange(agreement.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={agreement.id}
                        className="text-sm cursor-pointer"
                      >
                        Я ознакомился(ась) и согласен(на) с условиями
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {canProceed ? (
                <span className="text-green-600 font-medium">
                  ✓ Все обязательные соглашения приняты
                </span>
              ) : (
                <span className="text-red-600">
                  Необходимо принять все обязательные соглашения
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Отмена
              </Button>
              <Button
                onClick={handleAccept}
                disabled={!canProceed}
                className="min-w-[120px]"
              >
                Принимаю условия
              </Button>
            </div>
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