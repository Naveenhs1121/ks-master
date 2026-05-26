// ============================
// frontend/app/styles.js
// Shared stylesheet used across multiple components
// of the app. Defines layout, text, and color
// schemes for headers, tabs, forms, and response cards.
// Organized by component sections (container, header,
// tab styles, input styles, etc.).
// ----------------------------
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#bbb',
    backgroundColor: '#f9f9f9',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#222',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  languageContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  langButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  langButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4a7c2c',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#4a7c2c',
  },
  langText: {
    color: '#4a7c2c',
    fontWeight: '600',
    fontSize: 12,
  },
  langTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  questionInput: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickButtons: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  quickButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90c756',
  },
  quickBtnText: {
    color: '#2d5016',
    fontSize: 12,
    fontWeight: '600',
  },
  askButton: {
    backgroundColor: '#4a7c2c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#90c756',
  },
  askButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  responseContainer: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4a7c2c',
    marginBottom: 15,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 10,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  weatherCard: {
    backgroundColor: '#e3f2fd',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  weatherCity: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 10,
  },
  weatherTemp: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  weatherDesc: {
    fontSize: 18,
    color: '#1565c0',
    marginTop: 5,
  },
  weatherFeels: {
    fontSize: 14,
    color: '#1976d2',
    marginTop: 5,
  },
  weatherDetails: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  weatherDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  weatherDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  weatherDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  adviceCard: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    marginBottom: 15,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
  },
  adviceText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: '#fff9e6',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffa726',
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  tipsContainer: {
    flex: 1,
  },
  tipCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a7c2c',
    marginBottom: 15,
  },
  tipCardText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#2d5016',
  },
  bottomActions: {
    marginTop: 20,
  },
  historyButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a7c2c',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyButtonText: {
    color: '#4a7c2c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff5252',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    height: 30,
  },
});
