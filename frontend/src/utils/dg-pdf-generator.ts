import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Chart from 'chart.js/auto'

interface DAO {
  id: number
  reference: string
  objet: string
  autorite: string
  date_depot: string
  statut: string
  progression: number
  taches_total: number
  taches_completees: number
  risque: string
}

interface Task {
  id: number
  titre: string
  statut: string
  dao_id: number
  progression: number
}

interface Stats {
  totalDaos: number
  atRiskDaos: number
  inProgressDaos: number
  completedDaos: number
}

export const downloadDGComprehensivePDF = async (daos: DAO[], _tasks: Task[], stats: Stats) => {
  // Afficher l'indicateur de chargement
  const loadingOverlay = document.createElement('div')
  loadingOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: Roboto, Arial, sans-serif;
    font-size: 18px;
  `
  loadingOverlay.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 24px; margin-bottom: 10px;">📊</div>
      <div>Génération du rapport PDF en cours...</div>
    </div>
  `
  document.body.appendChild(loadingOverlay)

  try {
    // Créer le conteneur DOM virtuel
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 210mm;
      background: white;
      font-family: Roboto, Arial, sans-serif;
      padding: 20px;
    `

    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Template HTML complet
    container.innerHTML = `
      <div style="width: 100%; background: white;">
        <!-- En-tête Professionnel -->
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #6493FF 0%, #3155A7 100%); border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #3155A7;">2SND</div>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Rapport de Synthèse des DAO</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">${currentDate}</p>
        </div>

        <!-- Section Synthèse -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Synthèse Générale</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="background: linear-gradient(135deg, #6493FF 0%, #3155A7 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Total DAO</div>
              <div style="font-size: 24px; font-weight: bold;">${stats.totalDaos}</div>
            </div>
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">À risque</div>
              <div style="font-size: 24px; font-weight: bold;">${stats.atRiskDaos}</div>
            </div>
            <div style="background: linear-gradient(135deg, #eab308 0%, #d97706 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">En cours</div>
              <div style="font-size: 24px; font-weight: bold;">${stats.inProgressDaos}</div>
            </div>
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px;">Terminées</div>
              <div style="font-size: 24px; font-weight: bold;">${stats.completedDaos}</div>
            </div>
          </div>
        </div>

        <!-- Sections Individuelles par DAO -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Détails par DAO</h2>
          ${daos.map((dao, index) => `
            <div style="margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                  <h3 style="color: #1f2937; font-size: 16px; margin: 0;">${dao.reference} - ${dao.objet}</h3>
                  <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">Autorité: ${dao.autorite} | Dépôt: ${dao.date_depot}</p>
                </div>
                <div style="background: ${dao.statut === 'À risque' ? '#fef2f2' : dao.statut === 'En cours' ? '#fef3c7' : '#ecfdf5'}; color: ${dao.statut === 'À risque' ? '#991b1b' : dao.statut === 'En cours' ? '#92400e' : '#14532d'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${dao.statut}
                </div>
              </div>

              <!-- KPIs -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px;">
                <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                  <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Progression</div>
                  <div style="font-size: 16px; font-weight: bold; color: #1f2937;">${dao.progression}%</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                  <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Statut</div>
                  <div style="font-size: 14px; font-weight: bold; color: #1f2937;">${dao.statut}</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                  <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Tâches complétées</div>
                  <div style="font-size: 16px; font-weight: bold; color: #1f2937;">${dao.taches_completees}</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px;">
                  <div style="font-size: 11px; color: #6b7280; margin-bottom: 3px;">Total tâches</div>
                  <div style="font-size: 16px; font-weight: bold; color: #1f2937;">${dao.taches_total}</div>
                </div>
              </div>

              <!-- Graphique -->
              <div style="margin-bottom: 15px;">
                <canvas id="chart-${index}" width="400" height="200"></canvas>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Tableau Récapitulatif -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Tableau Récapitulatif</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Référence</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Objet</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Autorité</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Date</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Statut</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Progression</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Tâches</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Risque</th>
              </tr>
            </thead>
            <tbody>
              ${daos.map(dao => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${dao.reference}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${dao.objet}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${dao.autorite}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${dao.date_depot}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">
                    <span style="background: ${dao.statut === 'À risque' ? '#fef2f2' : dao.statut === 'En cours' ? '#fef3c7' : '#ecfdf5'}; color: ${dao.statut === 'À risque' ? '#991b1b' : dao.statut === 'En cours' ? '#92400e' : '#14532d'}; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">
                      ${dao.statut}
                    </span>
                  </td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">
                    <div style="width: 60px; height: 8px; background: #e5e7eb; border-radius: 4px; position: relative;">
                      <div style="width: ${dao.progression}%; height: 100%; background: ${dao.progression >= 80 ? '#22c55e' : dao.progression >= 50 ? '#eab308' : '#ef4444'}; border-radius: 4px;"></div>
                    </div>
                    <span style="margin-left: 5px; font-size: 10px;">${dao.progression}%</span>
                  </td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${dao.taches_completees}/${dao.taches_total}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">
                    <span style="color: ${dao.risque === 'Élevé' ? '#ef4444' : dao.risque === 'Moyen' ? '#eab308' : '#22c55e'}; font-weight: bold;">
                      ${dao.risque}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pied de page -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 10px;">
          <p>© ${new Date().getFullYear()} 2SND Technologies - Rapport généré automatiquement</p>
        </div>
      </div>
    `

    document.body.appendChild(container)

    // Générer les graphiques Chart.js
    for (let i = 0; i < daos.length; i++) {
      const canvas = document.getElementById(`chart-${i}`) as HTMLCanvasElement
      if (canvas) {
        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: ['Progression', 'Restant'],
            datasets: [{
              label: daos[i].reference,
              data: [daos[i].progression, 100 - daos[i].progression],
              backgroundColor: [
                daos[i].progression >= 80 ? '#22c55e' : daos[i].progression >= 50 ? '#eab308' : '#ef4444',
                '#e5e7eb'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: { font: { size: 10 } }
              },
              x: {
                ticks: { font: { size: 10 } }
              }
            }
          }
        })
      }
    }

    // Capturer le HTML en canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    // Créer le PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Ajouter les pages
    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      position -= pageHeight
    }

    // Sauvegarder le PDF
    const fileName = `rapport-dao-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    // Nettoyer
    document.body.removeChild(container)
    document.body.removeChild(loadingOverlay)

  } catch (error) {
    console.error('Erreur génération PDF:', error)
    document.body.removeChild(loadingOverlay)
    alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
  }
}
