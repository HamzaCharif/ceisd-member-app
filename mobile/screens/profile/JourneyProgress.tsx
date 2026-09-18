// /mobile/screens/profile/JourneyProgress.tsx
// Horizontal journey progress bar: Spark → Shape → Scale → Mentor.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { COLORS, STAGE_THRESHOLDS, STAGE_LABELS, STAGE_COLORS } from '../../../shared/constants';
import { StageType } from '../../../shared/types';

interface Props {
  currentStage: StageType;
  totalPoints: number;
}

const STAGES: StageType[] = [StageType.SPARK, StageType.SHAPE, StageType.SCALE, StageType.MENTOR];

export default function JourneyProgress({ currentStage, totalPoints }: Props): React.ReactElement {
  const [showCriteria, setShowCriteria] = useState(false);
  const currentIndex = STAGES.indexOf(currentStage);
  const stageColor = STAGE_COLORS[currentStage] ?? COLORS.primary;

  // Calculate progress percentage within current stage
  const currentThreshold = STAGE_THRESHOLDS[currentStage as keyof typeof STAGE_THRESHOLDS] ?? 0;
  const nextStageIndex = currentIndex + 1;
  const nextStage = STAGES[nextStageIndex];
  const nextThreshold = nextStage
    ? (STAGE_THRESHOLDS[nextStage as keyof typeof STAGE_THRESHOLDS] ?? currentThreshold + 500)
    : currentThreshold + 500;
  const progressPct = Math.min(
    ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100,
    100
  );

  return (
    <View style={styles.container}>
      {/* Stage name + points */}
      <View style={styles.topRow}>
        <Text style={[styles.stageName, { color: stageColor }]}>
          {STAGE_LABELS[currentStage]}
        </Text>
        <Text style={styles.points}>{totalPoints}</Text>
      </View>
      <Text style={styles.pointsLabel}>total points</Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` as any, backgroundColor: stageColor }]}>
          <View style={[styles.progressDot, { backgroundColor: stageColor }]} />
        </View>
      </View>

      {/* Stage milestone nodes */}
      <View style={styles.milestones}>
        {STAGES.map((stage, index) => {
          const unlocked = index <= currentIndex;
          const color = unlocked ? (STAGE_COLORS[stage] ?? COLORS.primary) : '#D1D5DB';
          return (
            <View key={stage} style={styles.milestoneItem}>
              <View style={[styles.milestoneNode, { backgroundColor: color }]} />
              <Text style={[styles.milestoneLabel, { color }]}>
                {STAGE_LABELS[stage]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Criteria link */}
      <TouchableOpacity onPress={() => setShowCriteria(true)}>
        <Text style={styles.criteriaLink}>See progression criteria ›</Text>
      </TouchableOpacity>

      {/* Criteria modal */}
      <Modal visible={showCriteria} transparent animationType="slide" onRequestClose={() => setShowCriteria(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Progression Criteria</Text>
            <ScrollView>
              {STAGES.map((stage) => {
                const sColor = STAGE_COLORS[stage] ?? COLORS.primary;
                return (
                  <View key={stage} style={styles.criteriaRow}>
                    <View style={[styles.criteriaNode, { backgroundColor: sColor }]}>
                      <Text style={styles.criteriaNodeText}>{STAGE_LABELS[stage][0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.criteriaStage}>{STAGE_LABELS[stage]}</Text>
                      <Text style={styles.criteriaPoints}>
                        {STAGE_THRESHOLDS[stage as keyof typeof STAGE_THRESHOLDS]}+ points
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowCriteria(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 },
  stageName: { fontSize: 18, fontWeight: '700' },
  points: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  pointsLabel: { fontSize: 12, color: '#6B7280', textAlign: 'right', marginBottom: 4 },
  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: '#E5E7EB',
    marginVertical: 16, overflow: 'visible',
  },
  progressFill: {
    height: 8, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
  },
  progressDot: {
    width: 10, height: 10, borderRadius: 5,
    marginRight: -5,
  },
  milestones: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  milestoneItem: { alignItems: 'center', flex: 1 },
  milestoneNode: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  milestoneLabel: { fontSize: 11, textAlign: 'center' },
  criteriaLink: { textAlign: 'center', fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  criteriaNode: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  criteriaNodeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  criteriaStage: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  criteriaPoints: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  modalCloseBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
