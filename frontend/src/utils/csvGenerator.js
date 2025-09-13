/**
 * Utility functions for generating and handling CSV data
 */

/**
 * Convert user profile data to CSV format
 * @param {Object} data - User profile data collected from LLM conversation
 * @returns {string} - CSV formatted string
 */
export const generateCSV = (data) => {
  // Define CSV headers
  const headers = ['user_id', 'risk_score', 'diversification', 'horizon_years', 'capital_usd', 'automation_enabled'];
  
  // Create header row
  let csv = headers.join(',') + '\n';
  
  // Create data row
  const values = headers.map(header => {
    // Handle special formatting for boolean values
    if (typeof data[header] === 'boolean') {
      return data[header] ? 'true' : 'false';
    }
    return data[header];
  });
  
  csv += values.join(',');
  
  return csv;
};

/**
 * Save CSV data to a file
 * @param {string} csvData - CSV formatted string
 * @param {string} filename - Name of the file to save
 */
export const saveCSVFile = (csvData, filename = 'user_profile.csv') => {
  // Create a blob with the CSV data
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add link to document
  document.body.appendChild(link);
  
  // Click the link to trigger download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
};

/**
 * Process user profile data and save as CSV
 * @param {Object} profileData - User profile data
 * @returns {string} - The generated CSV data
 */
export const processAndSaveUserProfile = (profileData) => {
  // Generate CSV data
  const csvData = generateCSV(profileData);
  
  // Save CSV file
  saveCSVFile(csvData);
  
  // Return CSV data for further processing if needed
  return csvData;
};