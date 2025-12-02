import {useState} from 'react';
import SingaporeMap, {type PostalCode} from 'react-singapore-map';
import './App.css';

// Sample data for different regions
const regionData: Record<PostalCode, { name: string; population: string; color: string }> = {
    1: {name: 'Raffles Place', population: '5,000', color: '#FF6B6B'},
    2: {name: 'Anson', population: '8,000', color: '#4ECDC4'},
    3: {name: 'Tanjong Pagar', population: '12,000', color: '#45B7D1'},
    4: {name: 'Telok Blangah', population: '15,000', color: '#96CEB4'},
    5: {name: 'Pasir Panjang', population: '18,000', color: '#FFEAA7'},
    6: {name: 'High Street', population: '6,000', color: '#DFE6E9'},
    7: {name: 'Beach Road', population: '9,000', color: '#74B9FF'},
    8: {name: 'Little India', population: '11,000', color: '#FD79A8'},
    9: {name: 'Orchard', population: '13,000', color: '#FDCB6E'},
    10: {name: 'Ardmore', population: '7,000', color: '#6C5CE7'},
    11: {name: 'Newton', population: '16,000', color: '#A29BFE'},
    12: {name: 'Balestier', population: '19,000', color: '#00B894'},
    13: {name: 'Macpherson', population: '22,000', color: '#00CEC9'},
    14: {name: 'Geylang', population: '25,000', color: '#55EFC4'},
    15: {name: 'Katong', population: '20,000', color: '#81ECEC'},
    16: {name: 'Bedok', population: '28,000', color: '#FAB1A0'},
    17: {name: 'Loyang', population: '14,000', color: '#FF7675'},
    18: {name: 'Simei', population: '24,000', color: '#FD79A8'},
    19: {name: 'Serangoon Garden', population: '17,000', color: '#FDCB6E'},
    20: {name: 'Hougang', population: '26,000', color: '#E17055'},
    21: {name: 'Clementi', population: '30,000', color: '#74B9FF'},
    22: {name: 'Jurong', population: '32,000', color: '#A29BFE'},
    23: {name: 'Bukit Batok', population: '29,000', color: '#55EFC4'},
    24: {name: 'Bukit Panjang', population: '27,000', color: '#DFE6E9'},
    25: {name: 'Admiralty', population: '23,000', color: '#00B894'},
    26: {name: 'Woodlands', population: '31,000', color: '#6C5CE7'},
    27: {name: 'Yishun', population: '33,000', color: '#FFEAA7'},
    28: {name: 'Seletar', population: '21,000', color: '#96CEB4'},
};

function App() {
    const [hoveredRegion, setHoveredRegion] = useState<any | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<any | null>(null);
    const [showBackground, setShowBackground] = useState(true);

    // Generate region fills based on population
    const regionFills: Record<any, string> = {};
    Object.entries(regionData).forEach(([code, data]) => {
        regionFills[Number(code)] = data.color;
    });

    // Generate region contents (tooltips)
    const regionContents: any = {};
    Object.entries(regionData).forEach(([code, data]) => {
        const postalCode = Number(code);
        const isHovered = hoveredRegion === postalCode;
        const isSelected = selectedRegion === postalCode;

        if (isHovered || isSelected) {
            regionContents[postalCode] = (
                <div className={`tooltip ${isSelected ? 'selected' : ''}`}>
                    <div className="tooltip-header">{data.name}</div>
                    <div className="tooltip-body">
                        <div className="tooltip-row">
                            <span className="tooltip-label">Postal Code:</span>
                            <span className="tooltip-value">{String(postalCode).padStart(2, '0')}</span>
                        </div>
                        <div className="tooltip-row">
                            <span className="tooltip-label">Population:</span>
                            <span className="tooltip-value">{data.population}</span>
                        </div>
                    </div>
                </div>
            );
        }
    });

    return (
        <div className="app">
            <div className="header">
                <h1>🇸🇬 Singapore Postal Code Map</h1>
                <p className="subtitle">Interactive map showing different regions of Singapore</p>
            </div>

            <div className="controls">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={showBackground}
                        onChange={(e) => setShowBackground(e.target.checked)}
                    />
                    <span>Show Background</span>
                </label>
            </div>

            <div className="map-container">
                <SingaporeMap
                    className="singapore-map"
                    background={showBackground}
                    regionFills={regionFills}
                    defaultRegionFill={'#fafafa'}
                    defaultRegionTextFill={"#000"}
                    regionContents={regionContents}
                    regionTextFills={{1: '#FFFFFF'}}
                    onRegionHover={(code) => setHoveredRegion(code)}
                    onRegionLeave={() => setHoveredRegion(null)}
                    placement="topCenter"
                />
            </div>

            <div className="info-panel">
                {selectedRegion && regionData[selectedRegion] ? (
                    <div className="info-card">
                        <h3>{regionData[selectedRegion].name}</h3>
                        <div className="info-details">
                            <div className="info-item">
                                <span className="info-label">Postal Code:</span>
                                <span className="info-value">{String(selectedRegion).padStart(2, '0')}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Population:</span>
                                <span className="info-value">{regionData[selectedRegion].population}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Color:</span>
                                <span className="color-box"
                                      style={{backgroundColor: regionData[selectedRegion].color}}></span>
                            </div>
                        </div>
                        <button className="close-btn" onClick={() => setSelectedRegion(null)}>Close</button>
                    </div>
                ) : (
                    <div className="info-placeholder">
                        <p>✨ Hover over a region to see details</p>
                        <p className="hint">Click on a region to pin the information</p>
                    </div>
                )}
            </div>

            <div className="legend">
                <h4>Region Colors</h4>
                <div className="legend-grid">
                    {Object.entries(regionData).slice(0, 8).map(([code, data]) => (
                        <div key={code} className="legend-item">
                            <span className="legend-color" style={{backgroundColor: data.color}}></span>
                            <span className="legend-text">{data.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;
