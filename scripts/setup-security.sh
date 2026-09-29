#!/bin/bash
# ============================================================
# Agua YA — Script de Seguridad Pre-Producción
# Ejecutar ANTES del primer despliegue de cada cliente
# ============================================================

set -e

echo ""
echo "🔐 ═══════════════════════════════════════════════"
echo "   AGUA YA — Configuración de Seguridad"
echo "═══════════════════════════════════════════════════"
echo ""

# 1. Generar JWT_SECRET seguro
JWT_SECRET=$(openssl rand -base64 32)
echo "✅ JWT_SECRET generado:"
echo ""
echo "   $JWT_SECRET"
echo ""
echo "⚠️  ACCIÓN REQUERIDA: Copia este valor y configúralo en:"
echo "   → Vercel Dashboard → Settings → Environment Variables"
echo "   → Variable: JWT_SECRET"
echo "   → Valor: $JWT_SECRET"
echo "   → Aplica a: Production, Preview, Development"
echo ""

# 2. Recordatorio de variables requeridas en Vercel
echo "📋 Variables de entorno OBLIGATORIAS en Vercel:"
echo ""
echo "   DATABASE_URL          = postgresql://... (ya debería estar)"
echo "   DIRECT_URL            = postgresql://... (ya debería estar)"
echo "   JWT_SECRET            = $JWT_SECRET"
echo ""

# 3. Verificar que .env no está en git
echo "🔍 Verificando que .env no está trackeado en git..."
if git ls-files --error-unmatch .env 2>/dev/null; then
  echo "   ⚠️  ¡ALERTA! .env ESTÁ trackeado en git. Removiendo..."
  git rm --cached .env
  echo "   ✅ .env removido del tracking de git"
else
  echo "   ✅ .env NO está trackeado en git (correcto)"
fi

if git ls-files --error-unmatch .env.local 2>/dev/null; then
  echo "   ⚠️  ¡ALERTA! .env.local ESTÁ trackeado en git. Removiendo..."
  git rm --cached .env.local
  echo "   ✅ .env.local removido del tracking de git"
else
  echo "   ✅ .env.local NO está trackeado en git (correcto)"
fi

echo ""
echo "🔐 ═══════════════════════════════════════════════"
echo "   IMPORTANTE: Actualiza el .env local con:"
echo "   JWT_SECRET=\"$JWT_SECRET\""
echo "═══════════════════════════════════════════════════"
echo ""
