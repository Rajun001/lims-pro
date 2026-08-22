import prisma from '../config/db.js';

/**
 * Servicio Generador y Diseñador de Planes de Muestreo Microbiológico a la Medida
 * Soporta Perfil A (Clientes con plan existente para mapear) y Perfil B (Hoteles/Empresas desde cero)
 */
export class SamplingPlanService {
  /**
   * Genera una propuesta recomendada de Plan de Muestreo Microbiológico para el Sector Hotelero/Gastronómico
   */
  static generateHotelSamplingPlanTemplate({ hotelName, _stars = 4, kitchenCount = 2, poolCount = 1, iceMachineCount = 2, frequency = 'MENSUAL' }) {
    const points = [];

    // 1. Matriz Agua Potable y Fabricadores de Hielo
    for (let i = 1; i <= kitchenCount; i++) {
      points.push({
        pointName: `Cocina Principal #${i} - Grifo de Insumos y Emplatado`,
        zoneCategory: 'AGUA_POTABLE',
        matrixType: 'Agua Potable',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Coliformes Totales', 'Escherichia coli', 'Recuento Heterotrófico 22°C/37°C'],
        isoStandardRef: 'ISO 6222 / ISO 9308-1'
      });
    }

    for (let i = 1; i <= iceMachineCount; i++) {
      points.push({
        pointName: `Máquina de Hielo #${i} (Depósito y Boquilla)`,
        zoneCategory: 'HIELO',
        matrixType: 'Hielo para Consumo',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Coliformes Fecales', 'Escherichia coli', 'Pseudomonas aeruginosa'],
        isoStandardRef: 'ISO 16266 / NMP Agua'
      });
    }

    // 2. Matriz Aguas Recreacionales (Piscinas / Jacuzzis / Torres de Enfriamiento - Legionella)
    for (let i = 1; i <= poolCount; i++) {
      points.push({
        pointName: `Piscina Principal / Jacuzzi #${i}`,
        zoneCategory: 'RECREACIONAL_PISCINA',
        matrixType: 'Agua Recreacional',
        samplingFrequency: 'QUINCENAL',
        targetParameters: ['Legionella pneumophila', 'Pseudomonas aeruginosa', 'Staphylococcus aureus', 'Turbidez & Cloro'],
        isoStandardRef: 'ISO 11731 (Legionella) / ISO 16266'
      });
    }

    // 3. Matriz Superficies de Contacto y Utensilios (ISO 18593)
    points.push(
      {
        pointName: 'Cocina - Tabla de Picar y Cuchillo de Carnes Cruas',
        zoneCategory: 'SUPERFICIE_CONTACTO',
        matrixType: 'Hisopado de Superficie',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Salmonella spp.', 'Listeria monocytogenes', 'Escherichia coli'],
        isoStandardRef: 'ISO 18593 / ISO 6579-1'
      },
      {
        pointName: 'Cocina - Mesa de Emplatado y Ensaladas (Frías)',
        zoneCategory: 'SUPERFICIE_CONTACTO',
        matrixType: 'Hisopado de Superficie',
        samplingFrequency: 'MENSUAL',
        targetParameters: ['Staphylococcus aureus', 'Recuento Aerobios Mesófilos'],
        isoStandardRef: 'ISO 6888-1 / ISO 4833-1'
      }
    );

    // 4. Manipuladores de Alimentos
    points.push({
      pointName: 'Hisopado de Manos - Personal de Cocina y Buffet',
      zoneCategory: 'MANIPULADOR',
      matrixType: 'Hisopado de Manos',
      samplingFrequency: 'MENSUAL',
      targetParameters: ['Staphylococcus aureus coagulasa +', 'Enterobacterias'],
      isoStandardRef: 'ISO 6888-1 / ISO 21528-2'
    });

    // 5. Calidad de Aire Ambientales (HVAC / Comedores / Cocina)
    points.push({
      pointName: 'Muestreo Ambiental de Aire - Comedor Principal & Buffet',
      zoneCategory: 'AIRE_AMBIENTAL',
      matrixType: 'Placa de Sedimentación Aire',
      samplingFrequency: 'TRIMESTRAL',
      targetParameters: ['Recuento Aerobios Mesófilos', 'Hongos y Levaduras'],
      isoStandardRef: 'ISO 14698 / Sedimentación Passive'
    });

    return {
      planName: `Plan de Control Microbiológico Integrado - ${hotelName}`,
      industrySector: 'HOTEL_HOSPITALITY',
      profileType: 'GENERATED_FROM_SCRATCH',
      frequency,
      totalPoints: points.length,
      points
    };
  }

  /**
   * Guarda un Plan de Muestreo Personalizado en la Base de Datos asociándolo a un Contrato
   */
  static async saveSamplingPlan({ contractId, planName, industrySector, profileType, frequency, points }) {
    const plan = await prisma.samplingPlan.create({
      data: {
        contractId: Number(contractId),
        planName,
        industrySector,
        profileType,
        frequency,
        status: 'ACTIVE'
      }
    });

    const createdPoints = [];
    for (const pt of points) {
      const createdPt = await prisma.samplingPlanPoint.create({
        data: {
          planId: plan.id,
          pointName: pt.pointName,
          zoneCategory: pt.zoneCategory,
          matrixType: pt.matrixType,
          samplingFrequency: pt.samplingFrequency || frequency,
          targetParameters: JSON.stringify(pt.targetParameters || []),
          isoStandardRef: pt.isoStandardRef || 'ISO Standard'
        }
      });
      createdPoints.push(createdPt);
    }

    return { plan, points: createdPoints };
  }
}
