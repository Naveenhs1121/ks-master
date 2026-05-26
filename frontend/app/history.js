// ============================
// frontend/app/history.js
// Screen to display past questions and AI responses
// fetched from backend /history/:farmerId. Includes
// pull-to-refresh, safe rendering helpers, and detailed
// formatting of answer objects.
// ----------------------------
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';

// Use centrally exported backend URL (reads from Expo extras)
import { BACKEND_URL } from './config';

// Helper to safely render any value
const SafeText = ({ value, textStyle }) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return <Text style={textStyle}>{String(value)}</Text>;
  }
  if (Array.isArray(value)) {
    return (
      <View>
        {value.map((item, idx) => (
          <Text key={idx} style={textStyle}>
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </Text>
        ))}
      </View>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return <Text style={textStyle}>{JSON.stringify(value, null, 2)}</Text>;
  }
  return <Text style={textStyle}>{String(value)}</Text>;
};

// 🔑 Normalize AI answer (supports OLD + NEW formats)
const normalizeAnswer = (answer) => {
  if (!answer) return {};

  if (typeof answer === 'string') {
    return { text: answer };
  }

  // NEW AskTab format
  if (
    answer.fertilizers ||
    answer.overall_analysis ||
    answer.soil_analysis_and_tips
  ) {
    return {
      text: answer.overall_analysis || '',
      fertilizers: answer.fertilizers || [],
      soilTips: answer.soil_analysis_and_tips || [],
      raw: answer,
    };
  }

  // OLD format
  return answer;
};

export default function HistoryScreen() {
  const { farmerId } = useLocalSearchParams();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/history/${farmerId}`);
      const data = response.data;
      const historyArray = data?.history ?? data;
      setHistory(Array.isArray(historyArray) ? historyArray : []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }) => {
    const ans = normalizeAnswer(item.answer);

    return (
      <View style={styles.historyItem}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString()}
        </Text>

        <View style={styles.languageBadge}>
          <Text style={styles.languageText}>
            {item.language || 'English'}
          </Text>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.label}>Question:</Text>
          <Text style={styles.question}>{item.question}</Text>
        </View>

        <View style={styles.answerContainer}>
          <Text style={styles.label}>AI Answer:</Text>

          {ans.text ? (
            <Text style={styles.answer}>{ans.text}</Text>
          ) : null}

          {/* NEW FORMAT: Fertilizers */}
          {ans.fertilizers && ans.fertilizers.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>
                Fertilizer Recommendations:
              </Text>
              {ans.fertilizers.map((f, i) => (
                <Text key={i} style={styles.answer}>
                  • {f.name} — {f.quantity_per_acre} per acre
                </Text>
              ))}
            </View>
          )}

          {/* NEW FORMAT: Soil Tips */}
          {ans.soilTips && ans.soilTips.length > 0 && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>
                Soil Analysis & Tips:
              </Text>
              {ans.soilTips.map((tip, i) => (
                <Text key={i} style={styles.answer}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

          {/* OLD FORMAT SUPPORT */}
          {ans.tips && Array.isArray(ans.tips) && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>Tips:</Text>
              {ans.tips.map((tip, idx) => (
                <Text key={idx} style={styles.answer}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

          {ans.steps && Array.isArray(ans.steps) && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>Steps:</Text>
              {ans.steps.map((step, idx) => (
                <Text key={idx} style={styles.answer}>
                  {idx + 1}. {step}
                </Text>
              ))}
            </View>
          )}

          {/* Catch-all */}
          {Object.keys(ans).filter(
            (k) =>
              ![
                'text',
                'fertilizers',
                'soilTips',
                'tips',
                'steps',
                'raw',
              ].includes(k)
          ).length > 0 && (
            <View
              style={{
                marginTop: 10,
                padding: 8,
                backgroundColor: '#f5f5f5',
                borderRadius: 6,
              }}
            >
              <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>
                Additional Information:
              </Text>
              {Object.keys(ans)
                .filter(
                  (k) =>
                    ![
                      'text',
                      'fertilizers',
                      'soilTips',
                      'tips',
                      'steps',
                      'raw',
                    ].includes(k)
                )
                .map((key) => (
                  <View key={key} style={{ marginTop: 4 }}>
                    <Text style={{ fontWeight: 'bold' }}>{key}:</Text>
                    <SafeText value={ans[key]} textStyle={styles.answer} />
                  </View>
                ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a7c2c" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No query history yet</Text>
          <Text style={styles.emptySubtext}>
            Start asking questions to see your history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : index.toString()
          }
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a7c2c']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  historyItem: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4a7c2c',
    elevation: 3,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  languageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  languageText: {
    fontSize: 12,
    color: '#4a7c2c',
    fontWeight: 'bold',
  },
  questionContainer: {
    marginBottom: 12,
  },
  answerContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d5016',
  },
  answer: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  container: {
  flex: 1,
  backgroundColor: '#F6F7F8',
  padding: 12,
},

chatWrapper: {
  marginBottom: 18,
},

/* ================= USER QUESTION ================= */
questionBubble: {
  alignSelf: 'flex-end',
  backgroundColor: '#DFF5E1',
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 14,
  maxWidth: '85%',
  marginBottom: 6,
  elevation: 2,
},

questionText: {
  fontSize: 15,
  color: '#1F3D2B',
  lineHeight: 22,
},

/* ================= AI ANSWER ================= */
answerBubble: {
  alignSelf: 'flex-start',
  backgroundColor: '#FFFFFF',
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 14,
  maxWidth: '90%',
  borderWidth: 1,
  borderColor: '#E6E6E6',
  elevation: 1,
},

aiLabel: {
  fontSize: 12,
  fontWeight: '600',
  color: '#269431',
  marginBottom: 6,
},

answerText: {
  fontSize: 15,
  color: '#333333',
  lineHeight: 23,
},
});