# Agent Next Prompt

Use this exact instruction for each agent run:

```text
Map Explorer Premium Redesign operating pack'i kullan.

Klasör:
map-explorer-premium-redesign-2026-06-05/

Yapılacak iş:
05_IMPLEMENTATION_PROMPTS.json içindeki status değeri `pending` olan ilk promptu sıradaki görev kabul et ve sadece onu uygula.

Önce oku:
- README.md
- 00_SCOPE_AND_GUARDRAILS.md
- 07_ANTI_AMNESIA_LEDGER.md
- 05_IMPLEMENTATION_PROMPTS.json
- seçtiğin promptun `read` listesindeki dosyalar

Kurallar:
- Başka prompta geçme.
- Sadece seçtiğin prompt kapsamındaki değişiklikleri yap.
- Promptun validation.commands listesindeki komutları çalıştır; çalıştıramadığın varsa sebebini yaz.
- İş bitince 07_ANTI_AMNESIA_LEDGER.md dosyasına completion kaydı ekle.
- 05_IMPLEMENTATION_PROMPTS.json içindeki seçtiğin promptun status alanını `implemented`, `blocked` veya `verified` olarak güncelle.
- Final cevapta hangi promptu uyguladığını, hangi dosyaları değiştirdiğini ve hangi validation komutlarının sonucunu özetle.
```

After an agent finishes, start the next run with the same instruction. The next agent should pick the next `pending` prompt automatically.
