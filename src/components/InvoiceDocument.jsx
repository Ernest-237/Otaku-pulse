// src/components/InvoiceDocument.jsx — facture imprimable (A4)
//
// Ce composant est un DOCUMENT, pas un formulaire : il n'affiche que ce que la
// facture contient déjà. Toute la saisie et tous les calculs vivent ailleurs
// (InvoicesSection côté écran, routes/adminInvoices.js côté serveur, qui reste
// la seule autorité sur les montants).
import { useMemo } from 'react'
import { code128Svg } from '../utils/barcode'
import {
  locate, distanceKm, describePosition, projectToBox, mapsUrl, CITIES,
} from '../utils/cameroonGeo'
import styles from './InvoiceDocument.module.css'

// Le FCFA n'a pas de sous-unité : jamais de décimale, et une espace fine
// insécable comme séparateur de milliers pour rester lisible à l'impression.
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR').replace(/ | /g, ' ')

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—'

const STATUS = {
  draft:     { label: 'Brouillon', cls: 'stampDraft'     },
  issued:    { label: 'À régler',  cls: 'stampIssued'    },
  // Un acompte a été encaissé : le tampon doit le dire, sinon le client
  // reçoit un document « à régler » alors qu'il a déjà payé une partie.
  partial:   { label: 'Acompte reçu', cls: 'stampIssued' },
  paid:      { label: 'Acquittée', cls: 'stampPaid'      },
  cancelled: { label: 'Annulée',   cls: 'stampCancelled' },
}

const METHOD_LABELS = {
  mtn_money: 'MTN Mobile Money', orange_money: 'Orange Money',
  cash: 'Espèces', transfer: 'Virement bancaire', card: 'Carte bancaire',
}

// ══════════════════════════════════════════════════════
// MINI-CARTE
// ══════════════════════════════════════════════════════
// Schéma vectoriel plutôt qu'une vraie carte à tuiles : pas de réseau requis à
// l'impression, rendu net en noir et blanc, aucune clé d'API à gérer. Ce dont
// un livreur a besoin, c'est d'une direction et d'une distance — pas d'une
// photo satellite.
function MiniMap({ invoice }) {
  const geo = useMemo(() => {
    const point  = locate({
      city: invoice.clientCity, quartier: invoice.clientQuartier,
      lat: invoice.destLat, lng: invoice.destLng,
    })
    const cityRef = point.cityRef || CITIES['Yaoundé']
    const dist    = distanceKm(cityRef, point)

    // L'échelle s'adapte : un point à 12 km ne doit pas être écrasé contre le
    // bord d'un cadre calibré pour 16 km. On garde toujours ~20 % de marge.
    const span = Math.max(cityRef.spanKm, dist * 2.5, 2)
    return { point, cityRef, dist, span, pos: projectToBox(point, cityRef, span) }
  }, [invoice.clientCity, invoice.clientQuartier, invoice.destLat, invoice.destLng])

  const { point, cityRef, dist, span, pos } = geo

  // Cadre 200x132 unités, marge intérieure de 12 pour que les marqueurs et
  // leurs étiquettes ne touchent jamais la bordure.
  const W = 200, H = 132, PAD = 14
  const px = PAD + pos.x * (W - PAD * 2)
  const py = PAD + pos.y * (H - PAD * 2)
  const cx = W / 2, cy = H / 2

  // Barre d'échelle : on cherche une distance ronde (1, 2, 5, 10 km…) qui
  // occupe grosso modo un quart de la largeur du cadre.
  const targetKm = span / 4
  const niceKm = [0.5, 1, 2, 5, 10, 20].reduce((best, k) =>
    Math.abs(k - targetKm) < Math.abs(best - targetKm) ? k : best, 0.5)
  const scaleW = (niceKm / span) * (W - PAD * 2)

  const isSamePoint = dist < 0.35

  return (
    <div className={styles.mapWrap}>
      <svg className={styles.mapFrame} viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Plan de situation : ${describePosition(point, cityRef)}`}>
        <rect x="0" y="0" width={W} height={H} fill="#f9fafb" />

        {/* Quadrillage de repérage, volontairement discret */}
        <g stroke="#e4e7ec" strokeWidth="0.5">
          {[0.25, 0.5, 0.75].map(f => (
            <line key={`v${f}`} x1={f * W} y1="0" x2={f * W} y2={H} />
          ))}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={`h${f}`} x1="0" y1={f * H} x2={W} y2={f * H} />
          ))}
        </g>

        {/* Rose des vents */}
        <g transform={`translate(${W - 15}, 15)`}>
          <path d="M0,-9 L3.4,4 L0,1.4 L-3.4,4 Z" fill="#101828" />
          <text x="0" y="12.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#101828">N</text>
        </g>

        {/* Trait centre → destination */}
        {!isSamePoint && (
          <line x1={cx} y1={cy} x2={px} y2={py}
            stroke="#16a34a" strokeWidth="1.2" strokeDasharray="3.5 2.5" />
        )}

        {/* Centre-ville : repère secondaire */}
        <g>
          <circle cx={cx} cy={cy} r="3.4" fill="#fff" stroke="#667085" strokeWidth="1.3" />
          <circle cx={cx} cy={cy} r="1.2" fill="#667085" />
          {!isSamePoint && (
            <text x={cx} y={cy + 11} textAnchor="middle" fontSize="6.6" fill="#667085">
              Centre {cityRef.label}
            </text>
          )}
        </g>

        {/* Destination : goutte pleine, le seul élément saturé du dessin */}
        <g transform={`translate(${px}, ${py})`}>
          <path d="M0,0 C-6.4,-8.4 -8.2,-11.6 -8.2,-15 A8.2,8.2 0 1 1 8.2,-15 C8.2,-11.6 6.4,-8.4 0,0 Z"
            fill="#16a34a" stroke="#0f7a37" strokeWidth="0.8" />
          <circle cx="0" cy="-15" r="3.1" fill="#fff" />
        </g>

        {/* Barre d'échelle */}
        <g transform={`translate(${PAD}, ${H - 8})`}>
          <line x1="0" y1="0" x2={scaleW} y2="0" stroke="#101828" strokeWidth="1.1" />
          <line x1="0" y1="-2.6" x2="0" y2="2.6" stroke="#101828" strokeWidth="1.1" />
          <line x1={scaleW} y1="-2.6" x2={scaleW} y2="2.6" stroke="#101828" strokeWidth="1.1" />
          <text x={scaleW + 4} y="2.4" fontSize="6.6" fill="#101828">
            {niceKm < 1 ? `${niceKm * 1000} m` : `${niceKm} km`}
          </text>
        </g>
      </svg>

      <div className={styles.mapCaption}>
        <strong>{describePosition(point, cityRef)}</strong>
        {' · '}{Number(point.lat).toFixed(5)}, {Number(point.lng).toFixed(5)}
        <br />
        {/* Le lien est imprimé en clair : sur papier, un href est invisible. */}
        {mapsUrl(point.lat, point.lng)}
        {point.source !== 'manual' && (
          <>
            <br />
            <span className={styles.mapApprox}>
              {point.source === 'quartier'
                ? `Position approximative du quartier ${point.matchedName}.`
                : `Quartier non reconnu — repère placé sur le centre de ${cityRef.label}.`}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// DOCUMENT
// ══════════════════════════════════════════════════════
export default function InvoiceDocument({ invoice, company }) {
  if (!invoice) return null

  const co     = company || {}
  const status = STATUS[invoice.status] || STATUS.draft
  const items  = Array.isArray(invoice.items) ? invoice.items : []

  // Le code-barres encode le numéro de facture : c'est ce qu'on scanne pour
  // retrouver le dossier. Si le numéro contenait un caractère non encodable
  // (accent), l'encodeur renvoie null et on n'affiche simplement rien plutôt
  // qu'un code faux — un code-barres illisible est pire qu'aucun code-barres.
  const barcode = useMemo(
    () => invoice.invoiceNumber ? code128Svg(invoice.invoiceNumber, { height: 34, module: 1.35 }) : null,
    [invoice.invoiceNumber]
  )

  const hasDelivery = !!(invoice.clientQuartier || invoice.clientAddress
    || invoice.destLat || invoice.clientCity)

  return (
    <div className={styles.sheet}>
      {/* ── En-tête ── */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <h1 className={styles.logo}><span className={styles.bolt}>⚡</span>{co.name || 'OTAKU PULSE'}</h1>
          <div className={styles.tagline}>{co.tagline}</div>
          <div className={styles.brandMeta}>
            {co.address && <>{co.address}<br /></>}
            {co.phone   && <>Tél. <strong>{co.phone}</strong><br /></>}
            {co.email   && <>{co.email}<br /></>}
            {co.website && <>{co.website}</>}
            {(co.rccm || co.niu) && (
              <>
                <br />
                {co.rccm && <>RCCM : <strong>{co.rccm}</strong>{co.niu ? ' · ' : ''}</>}
                {co.niu  && <>NIU : <strong>{co.niu}</strong></>}
              </>
            )}
          </div>

          {/* Numéros de dépôt Mobile Money, en en-tête : c'est l'information
              que le client cherche en premier pour payer. La faire figurer
              tout en haut évite qu'il ait à parcourir la facture. */}
          {(co.momoMtn || co.momoOrange) && (
            <div className={styles.depotBox}>
              <div className={styles.depotTitle}>Dépôt Mobile Money</div>
              {co.momoMtn && (
                <div className={styles.depotLine}>
                  <span className={styles.depotOp}>MTN MoMo</span>
                  <span className={styles.depotNum}>{co.momoMtn}</span>
                </div>
              )}
              {co.momoOrange && (
                <div className={styles.depotLine}>
                  <span className={styles.depotOp}>Orange Money</span>
                  <span className={styles.depotNum}>{co.momoOrange}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.docMeta}>
          <div className={styles.docType}>Facture</div>
          <div className={styles.docNumber}>{invoice.invoiceNumber || '—'}</div>
          <div className={styles.docDates}>
            Émise le {fmtDate(invoice.issuedAt || invoice.createdAt)}
            {invoice.dueAt  && <><br />Échéance : {fmtDate(invoice.dueAt)}</>}
            {invoice.paidAt && <><br />Réglée le {fmtDate(invoice.paidAt)}</>}
          </div>
          {barcode && (
            <div className={styles.barcode} dangerouslySetInnerHTML={{ __html: barcode }} />
          )}
          <div className={`${styles.stamp} ${styles[status.cls]}`}>{status.label}</div>
        </div>
      </header>

      {/* ── Lignes ── */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Désignation</th>
            <th className={styles.thQty}>Qté</th>
            <th className={styles.thUnit}>P.U.</th>
            <th className={styles.thTotal}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#667085' }}>Aucune ligne</td></tr>
          ) : items.map((it, i) => (
            <tr key={i}>
              <td className={styles.tdLabel}>{it.label}</td>
              <td className={`${styles.tdQty} ${styles.num}`}>{it.qty}</td>
              <td className={`${styles.tdUnit} ${styles.num}`}>{fmt(it.unitPrice)}</td>
              <td className={styles.num}>{fmt(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totaux et paiement ── */}
      <section className={styles.bottom}>
        {/* Les numéros de dépôt figurent en en-tête ; ce bloc ne rappelle que
            le moyen retenu et la référence à mentionner au moment du paiement. */}
        <div className={styles.payBox}>
          <div className={styles.payTitle}>Règlement</div>
          <div className={styles.payLine}>
            {invoice.paymentMethod && (
              <>Moyen : <strong>{METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod}</strong><br /></>
            )}
            Dépôt sur l'un des numéros Mobile Money indiqués en en-tête.
            <br />
            Merci d'indiquer la référence <strong>{invoice.invoiceNumber}</strong> lors du paiement.
          </div>
        </div>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Sous-total</span>
            <span className={styles.num}>{fmt(invoice.subtotal)} {invoice.currency}</span>
          </div>
          {invoice.discount > 0 && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Remise</span>
              <span className={styles.num}>− {fmt(invoice.discount)} {invoice.currency}</span>
            </div>
          )}
          {invoice.shipping > 0 && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Livraison</span>
              <span className={styles.num}>{fmt(invoice.shipping)} {invoice.currency}</span>
            </div>
          )}
          {invoice.taxRate > 0 && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>
                {/* Le taux est stocké en points de base : 1925 → 19,25 % */}
                {invoice.taxLabel || 'TVA'} ({(invoice.taxRate / 100).toFixed(2).replace('.', ',')} %)
              </span>
              <span className={styles.num}>{fmt(invoice.taxAmount)} {invoice.currency}</span>
            </div>
          )}
          <div className={`${styles.totalRow} ${styles.totalGrand}`}>
            <span className={styles.totalLabel}>
              {invoice.taxRate > 0 ? 'Total TTC' : 'Total'}
            </span>
            <span className={styles.num}>{fmt(invoice.total)} {invoice.currency}</span>
          </div>

          {/* Acomptes : le client doit lire sur le document ce qu'il a déjà
              versé et ce qu'il lui reste à payer, sans avoir à le calculer. */}
          {invoice.amountPaid > 0 && (
            <>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Déjà réglé</span>
                <span className={styles.num}>− {fmt(invoice.amountPaid)} {invoice.currency}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalDue}`}>
                <span className={styles.totalLabel}>Reste à payer</span>
                <span className={styles.num}>
                  {fmt(Math.max(0, invoice.total - invoice.amountPaid))} {invoice.currency}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {invoice.notes && <div className={styles.notes}>{invoice.notes}</div>}

      {/* ── Client et livraison, en bas de page ──
          Bloc volontairement détaché du reste : les coordonnées du client et
          l'adresse de livraison sont l'information que le livreur consulte,
          et elle ne doit pas se mélanger aux coordonnées d'Otaku Pulse
          imprimées juste en dessous. */}
      <section className={styles.clientZone}>
        <div className={styles.clientZoneTitle}>Informations client</div>
        <div className={styles.parties}>
          <div className={styles.party}>
            <div className={styles.partyTitle}>Facturé à</div>
            <div className={styles.partyName}>{invoice.clientName}</div>
            <div className={styles.partyLine}>
              {invoice.clientPhone && <>Tél. <strong>{invoice.clientPhone}</strong><br /></>}
              {invoice.clientEmail && <>{invoice.clientEmail}<br /></>}
              {invoice.clientCity  && <>{invoice.clientCity}</>}
              {invoice.clientQuartier && <> · {invoice.clientQuartier}</>}
              {invoice.clientAddress && <><br />{invoice.clientAddress}</>}
            </div>
          </div>

          {hasDelivery && (
            <div className={styles.party}>
              <div className={styles.partyTitle}>Livraison</div>
              <div className={styles.partyName}>
                {invoice.clientQuartier || invoice.clientCity || '—'}
              </div>
              {invoice.destLandmark && (
                <div className={styles.partyLine}>Repère : <strong>{invoice.destLandmark}</strong></div>
              )}
              <MiniMap invoice={invoice} />
            </div>
          )}
        </div>
      </section>

      {/* ── Pied de page ── */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>⚡ {co.name || 'OTAKU PULSE'}</div>
        <div>
          {co.email}{co.phone ? ` · ${co.phone}` : ''}{co.website ? ` · ${co.website}` : ''}
        </div>
        <div className={styles.footerLegal}>
          {invoice.taxRate > 0
            ? `Montants exprimés en ${invoice.currency}, ${invoice.taxLabel || 'TVA'} incluse.`
            : `Montants exprimés en ${invoice.currency}. TVA non applicable.`}
          {' '}Document généré électroniquement, valable sans signature.
        </div>
      </footer>
    </div>
  )
}
