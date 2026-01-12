import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseFunctionsError } from "@/lib/parseFunctionsError";
import { CreditCard, Lock, Check, AlertCircle, Loader2, Shield, ExternalLink, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MERCADO_PAGO_PUBLIC_KEY } from "@/config/mercadoPago";
import { Separator } from "@/components/ui/separator";

declare global {
  interface Window {
    MercadoPago: any;
    MP_DEVICE_SESSION_ID?: string;
  }
}

interface CardSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    name: string;
    price: number;
    billingFrequency: string;
    months: number;
    monthlyPrice: number;
  } | null;
  onSuccess: () => void;
}

export function CardSubscriptionDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: CardSubscriptionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cardFormReady, setCardFormReady] = useState(false);
  const [cardFormError, setCardFormError] = useState<string | null>(null);
  const [cardErrorCode, setCardErrorCode] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [deviceSessionId, setDeviceSessionId] = useState<string | null>(null);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const cardFormRef = useRef<any>(null);
  const mpInstanceRef = useRef<any>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Form fields for manual input (fallback)
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [identificationType, setIdentificationType] = useState("CPF");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open && plan) {
      initializeCardForm();
      loadUserData();
      captureDeviceSessionId();
    }
    
    return () => {
      if (cardFormRef.current) {
        try {
          cardFormRef.current.unmount();
        } catch (e) {
          console.log("CardForm unmount error:", e);
        }
        cardFormRef.current = null;
      }
    };
  }, [open, plan]);

  // Capture the device session ID from Mercado Pago security script with polling
  const captureDeviceSessionId = () => {
    let attempts = 0;
    const maxAttempts = 15; // Try for up to 4.5 seconds (15 * 300ms)
    
    const tryCapture = () => {
      const sessionId = window.MP_DEVICE_SESSION_ID;
      if (sessionId) {
        setDeviceSessionId(sessionId);
        console.log("🔐 Device Session ID captured:", sessionId.slice(0, 8) + "...", `(attempt ${attempts + 1})`);
        return true;
      }
      return false;
    };

    // Try immediately first
    if (tryCapture()) return;

    // Then poll every 300ms
    const intervalId = setInterval(() => {
      attempts++;
      if (tryCapture() || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (attempts >= maxAttempts && !window.MP_DEVICE_SESSION_ID) {
          console.warn("⚠️ Device Session ID not available after", maxAttempts, "attempts");
        }
      }
    }, 300);
  };

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setEmail(user.email);
    }
  };

  const initializeCardForm = async () => {
    if (!window.MercadoPago) {
      setCardFormError("SDK do Mercado Pago não carregado. Tente recarregar a página.");
      return;
    }

    try {
      // Use public key from config (publishable)
      const publicKey = MERCADO_PAGO_PUBLIC_KEY;

      if (!publicKey) {
        setCardFormError("Chave pública do Mercado Pago não configurada.");
        return;
      }
      
      mpInstanceRef.current = new window.MercadoPago(publicKey, {
        locale: "pt-BR",
      });

      setCardFormReady(true);
      setCardFormError(null);
    } catch (error: any) {
      console.error("Error initializing MercadoPago:", error);
      setCardFormError("Erro ao inicializar o formulário de pagamento.");
    }
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const formatted = numbers.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted.slice(0, 19);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value.slice(0, 14);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan || !mpInstanceRef.current) {
      toast.error("Erro ao processar pagamento");
      return;
    }

    // Validate fields
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanCardNumber.length < 13) {
      toast.error("Número do cartão inválido");
      return;
    }

    if (!cardholderName.trim()) {
      toast.error("Nome do titular é obrigatório");
      return;
    }

    if (!expirationMonth || !expirationYear) {
      toast.error("Data de validade é obrigatória");
      return;
    }

    if (securityCode.length < 3) {
      toast.error("CVV inválido");
      return;
    }

    const cleanIdentification = identificationNumber.replace(/\D/g, "");
    if (cleanIdentification.length < 11) {
      toast.error("CPF inválido");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Email válido é obrigatório");
      return;
    }

    console.log("🚀 Sending payment with:", {
      email,
      identification: { type: identificationType, number: cleanIdentification.slice(0, 3) + "***" },
      deviceSessionId: deviceSessionId ? deviceSessionId.slice(0, 8) + "..." : "NOT_AVAILABLE"
    });

    setLoading(true);
    setLastPaymentId(null);
    setCardFormError(null);
    setCardErrorCode(null);

    try {
      // Create card token using MP SDK
      const cardData = {
        cardNumber: cleanCardNumber,
        cardholderName: cardholderName.trim(),
        cardExpirationMonth: expirationMonth.padStart(2, "0"),
        cardExpirationYear: expirationYear.length === 2 ? `20${expirationYear}` : expirationYear,
        securityCode: securityCode,
        identificationType: identificationType,
        identificationNumber: cleanIdentification,
      };

      console.log("Creating card token...");

      const tokenResponse = await mpInstanceRef.current.createCardToken(cardData);

      if (!tokenResponse.id) {
        throw new Error("Não foi possível processar os dados do cartão");
      }

      console.log("Card token created:", tokenResponse.id);

      // Call edge function with card token and device session ID
      const { data, error } = await supabase.functions.invoke("create-subscription-preference", {
        body: {
          plan_id: plan.id,
          plan_name: plan.name,
          price: plan.price,
          billing_frequency: plan.billingFrequency,
          months: plan.months,
          card_token_id: tokenResponse.id,
          payer_email: email,
          payer_identification: {
            type: identificationType,
            number: cleanIdentification,
          },
          device_session_id: deviceSessionId || undefined,
        },
      });

      if (error) {
        const parsed = await parseFunctionsError(error);
        throw new Error(parsed.message);
      }

      if (data.error) {
        // Capture payment ID for support reference if available
        if (data.payment_id) {
          setLastPaymentId(data.payment_id);
        }
        throw new Error(data.error_description || data.error || "Erro ao processar pagamento");
      }

      // Also capture successful payment ID
      if (data.payment_id) {
        setLastPaymentId(data.payment_id);
      }

      console.log("Subscription created:", data);
      toast.success("🎉 Pagamento aprovado!", {
        description: "Sua assinatura foi ativada com sucesso.",
      });

      // Wait a moment then close and refresh
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setPaymentSuccess(false);
        resetForm();
      }, 2000);

    } catch (error: any) {
      console.error("Payment error:", error);
      
      // Parse MP error messages
      let errorMessage = error.message || "Erro ao processar pagamento";
      
      if (error.cause) {
        const causes = error.cause;
        if (Array.isArray(causes) && causes.length > 0) {
          const firstCause = causes[0];
          if (firstCause.description) {
            errorMessage = firstCause.description;
          }
        }
      }

      // Translate common errors
      const errorTranslations: Record<string, string> = {
        "invalid_card_number": "Número do cartão inválido",
        "invalid_expiration_date": "Data de validade inválida",
        "invalid_security_code": "Código de segurança inválido",
        "card_token_creation_failed": "Falha ao processar cartão. Verifique os dados.",
        "cc_rejected_insufficient_amount": "Saldo insuficiente no cartão",
        "cc_rejected_bad_filled_card_number": "Número do cartão incorreto",
        "cc_rejected_bad_filled_security_code": "Código de segurança incorreto",
        "cc_rejected_bad_filled_date": "Data de validade incorreta",
        "cc_rejected_high_risk": "Pagamento recusado por política de segurança",
        "cc_rejected_call_for_authorize": "Ligue para a operadora do cartão para autorizar",
        "cc_rejected_card_disabled": "Cartão desabilitado. Contate a operadora.",
        "cc_rejected_other_reason": "Pagamento recusado. Tente outro cartão.",
      };

      for (const [key, translation] of Object.entries(errorTranslations)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
          errorMessage = translation;
          break;
        }
      }

      // Extract error code from error message or data
      let extractedErrorCode = "";
      if (error.message?.includes("cc_rejected_high_risk")) {
        extractedErrorCode = "cc_rejected_high_risk";
      } else if (error.message?.includes("cc_rejected")) {
        extractedErrorCode = error.message.match(/cc_rejected_\w+/)?.[0] || "cc_rejected";
      }
      
      setCardFormError(errorMessage);
      setCardErrorCode(extractedErrorCode);
      toast.error("Erro no pagamento", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Redirect to Mercado Pago checkout
  const handleCheckoutFallback = async () => {
    if (!plan) return;
    
    setLoadingFallback(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-preference", {
        body: {
          plan_id: plan.id,
          plan_name: plan.name,
          price: plan.price,
          billing_frequency: plan.billingFrequency,
          months: plan.months,
          // NO card_token_id = redirect flow
        },
      });

      if (error) {
        const parsed = await parseFunctionsError(error);
        throw new Error(parsed.message);
      }

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Não foi possível gerar o link de pagamento");
      }
    } catch (error: any) {
      toast.error("Erro ao redirecionar", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setLoadingFallback(false);
    }
  };

  const resetForm = () => {
    setCardNumber("");
    setCardholderName("");
    setExpirationMonth("");
    setExpirationYear("");
    setSecurityCode("");
    setIdentificationNumber("");
    setCardFormError(null);
    setCardErrorCode(null);
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Pagamento com Cartão
          </DialogTitle>
          <DialogDescription>
            Insira os dados do seu cartão de crédito para ativar sua assinatura
          </DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                Pagamento Aprovado!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sua assinatura {plan.name} foi ativada com sucesso.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Plan Summary */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{plan.name}</span>
                <Badge variant="secondary">{plan.billingFrequency}</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  R$ {plan.price.toFixed(2).replace(".", ",")}
                </span>
                {plan.months > 1 && (
                  <span className="text-sm text-muted-foreground">
                    (R$ {plan.monthlyPrice.toFixed(2).replace(".", ",")}/mês)
                  </span>
                )}
              </div>
            </div>

            {cardFormError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{cardFormError}</p>
                </div>
                
                {/* Show alternative payment options when card is rejected */}
                {cardErrorCode && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground font-medium">
                      Alternativas de pagamento:
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCheckoutFallback}
                        disabled={loadingFallback}
                        className="w-full justify-start"
                      >
                        {loadingFallback ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        Pagar pelo site do Mercado Pago
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          // Emit event for parent to open PIX dialog
                          window.dispatchEvent(new CustomEvent('openPixPayment', { detail: plan }));
                        }}
                        className="w-full justify-start"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Pagar com PIX
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do Cartão</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="pl-10"
                    maxLength={19}
                    disabled={loading}
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Nome no Cartão</Label>
                <Input
                  id="cardholderName"
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>

              {/* Expiration and CVV */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expirationMonth">Mês</Label>
                  <Input
                    id="expirationMonth"
                    placeholder="MM"
                    value={expirationMonth}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                      if (parseInt(val) <= 12 || val.length < 2) {
                        setExpirationMonth(val);
                      }
                    }}
                    maxLength={2}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationYear">Ano</Label>
                  <Input
                    id="expirationYear"
                    placeholder="AA"
                    value={expirationYear}
                    onChange={(e) => setExpirationYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    maxLength={2}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityCode">CVV</Label>
                  <Input
                    id="securityCode"
                    placeholder="000"
                    type="password"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="identificationNumber">CPF do Titular</Label>
                <Input
                  id="identificationNumber"
                  placeholder="000.000.000-00"
                  value={identificationNumber}
                  onChange={(e) => setIdentificationNumber(formatCPF(e.target.value))}
                  maxLength={14}
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Security Notice */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Pagamento seguro processado pelo Mercado Pago. Seus dados estão protegidos.</span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !cardFormReady}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Pagar R$ {plan.price.toFixed(2).replace(".", ",")}
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
