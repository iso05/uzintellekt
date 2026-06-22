#!/bin/bash
# =====================================================
# Uzintellekt — VPS MINIMAL SETUP (Nginx ga tegmasdan)
# Faqat SSH deploy kaliti yaratadi + papka ruxsatlarini beradi
# Backendchi konfiguratsiyasiga MUTLAQO TEGMAYDI
# =====================================================

set -e

echo "🔑 GitHub Actions uchun SSH deploy kalit yaratilmoqda..."

# Agar oldin yaratilgan bo'lsa, qayta yaratmaslik
if [ -f ~/.ssh/deploy_key ]; then
    echo "⚠️  deploy_key allaqachon mavjud. Yangisini yaratmaysiz."
    echo "Mavjud public keyni ko'rish:"
    cat ~/.ssh/deploy_key.pub
else
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N "" -q
    cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo "✅ Yangi kalit yaratildi."
fi

echo ""
echo "📁 /www/main va /www/dashboard papkalariga yozish ruxsati tekshirilmoqda..."

# Faqat ruxsat berish — papka mavjud deb hisoblaymiz (backendchi yaratgan)
if [ -d /www/main ]; then
    sudo chown -R $USER:$USER /www/main
    echo "✅ /www/main — ruxsat berildi"
else
    echo "⚠️  /www/main papkasi topilmadi! Backendchidan so'rang yoki yo'lni tekshiring."
fi

if [ -d /www/dashboard ]; then
    sudo chown -R $USER:$USER /www/dashboard
    echo "✅ /www/dashboard — ruxsat berildi"
else
    echo "⚠️  /www/dashboard papkasi topilmadi!"
fi

# Admin panel papkasini ham tekshiramiz (mavjud bo'lsa)
if [ -d /www/admin ]; then
    sudo chown -R $USER:$USER /www/admin
    echo "✅ /www/admin — ruxsat berildi"
else
    echo "ℹ️  /www/admin papkasi yo'q (Admin-panel uchun backendchidan so'rang)"
fi

echo ""
echo "================================================"
echo "✅ Setup tugadi! GitHub Secrets ga qo'shing:"
echo "================================================"
echo ""
echo "  VPS_HOST   = $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "  VPS_USER   = $USER"
echo "  VPS_PORT   = 22"
echo ""
echo "  VPS_SSH_KEY (quyidagi BUTUN textni nusxalang — BEGIN dan END gacha):"
echo ""
cat ~/.ssh/deploy_key
echo ""
echo "================================================"
echo "🚀 Shundan keyin git push qilsangiz avtomatik deploy bo'ladi!"
