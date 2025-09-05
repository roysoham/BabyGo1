echo
echo "S8) Safety (Paris) -> at least 2 clinics"
curl -s "$BASE/api/safety?city=Paris" | jq '.items | length'

echo
echo "S9) Packing template (tropical) -> sections exist"
test -f data/packing_templates.json && jq '.templates.tropical.universal | length' data/packing_templates.json
