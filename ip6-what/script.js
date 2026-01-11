import { Address6 } from 'https://esm.sh/ip-address@10.1.0?bundle';
import { knownData } from './known.js';

const inputEl = document.getElementById('ipv6-input');
const refBtn = document.getElementById('ref-btn');
const refPanel = document.getElementById('ref-panel');
const refClose = document.getElementById('ref-close');
const refPin = document.getElementById('ref-pin');
const refOverlay = document.getElementById('ref-overlay');
const refContent = document.getElementById('ref-content');
const refSearch = document.getElementById('ref-search');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');
const errorMessage = document.getElementById('error-message');
const tooltip = document.getElementById('global-tooltip');
const debugBtn = document.getElementById('debug-btn');
const debugOutput = document.getElementById('debug-output');

let activeTarget = null;
let currentDebugData = null;
// Default pinned on desktop
let isPinned = window.innerWidth >= 1200;

// Consolidated descriptions object
const descriptions = {
    'Valid': '<strong>Syntax Status</strong><br>Shows if the entered string follows the formal rules for IPv6 addresses.',
    'Address': '<strong>Display Address</strong><br>The IP address as interpreted by the system.',
    'Port': '<strong>Port Number</strong><br>Identifies a specific process or service.',
    'Scope ID': '<strong>Interface Scope</strong><br>Used with Link-Local addresses to specify the network interface.',
    'Standard Form': '<strong>RFC 5952 Standard</strong><br>The official, compressed representation.',
    'Full Form': '<strong>Uncompressed / Canonical</strong><br>The address fully expanded to 32 hexadecimal digits.',
    'Integer Value': '<strong>Decimal Representation</strong><br>The unique 128-bit number of this address.',
    'Subnet Mask': '<strong>Network Prefix</strong><br>Defines the network size.',
    'Multicast Flags': '<strong>Address Properties</strong><br>T: Transient, P: Prefix-based, R: Rendezvous Point.',
    'Multicast Scope': '<strong>Transmission Range</strong><br>How far the multicast packet will travel.',
    'Link Local': '<strong>Link Local</strong><br>Valid only on the local network segment.',
    'Multicast': '<strong>Multicast</strong><br>One-to-Many communication.',
    'Loopback': '<strong>Loopback</strong><br>Localhost address.',
    'Unique Local': '<strong>Unique Local</strong><br>Private network address (ULA).',
    'Unspecified': '<strong>Unspecified</strong><br>The zero address.',
    'Teredo': '<strong>Teredo</strong><br>Tunneling mechanism.',
    'V4 Mapped': '<strong>IPv4 Mapped</strong><br>IPv4 address represented in IPv6.',
    '6to4': '<strong>6to4</strong><br>Transition mechanism.',
    'Canonical': '<strong>Canonical</strong><br>Is in strictly correct format.',
    'Start Address': '<strong>Range Start</strong><br>First address in the subnet.',
    'End Address': '<strong>Range End</strong><br>Last address in the subnet.',
    'Start (Full)': '<strong>Range Start (Full)</strong><br>Uncompressed first address.',
    'End (Full)': '<strong>Range End (Full)</strong><br>Uncompressed last address.',
    'Total Addresses': '<strong>Capacity</strong><br>Total IPs in this block.',
    'Parsed Parts': '<strong>Segments</strong><br>Raw hexadecimal parts.'
};

function init() {
    renderReference();
    inputEl.addEventListener('input', handleInput);
    
    if (refBtn) refBtn.addEventListener('click', openReference);
    if (refClose) refClose.addEventListener('click', closeReference);
    if (refOverlay) refOverlay.addEventListener('click', closeReference);
    if (refPin) refPin.addEventListener('click', togglePin);
    
    if (refSearch) {
        refSearch.addEventListener('input', (e) => {
            renderReference(e.target.value);
        });
    }
    
    if (debugBtn) {
        debugBtn.addEventListener('click', () => {
            debugOutput.classList.toggle('hidden');
            updateDebugDisplay();
        });
    }

    if(window.location.hash) {
        const val = decodeURIComponent(window.location.hash.substring(1));
        inputEl.value = val;
        analyze(val);
    }
}

function updateDebugDisplay() {
    if (!debugOutput.classList.contains('hidden') && currentDebugData) {
        debugOutput.textContent = JSON.stringify(currentDebugData, null, 2);
    }
}

function openReference() {
    refPanel.classList.add('open');
    if (!isPinned && window.innerWidth < 1200) refOverlay.classList.add('open');
}

function closeReference() {
    refPanel.classList.remove('open');
    refOverlay.classList.remove('open');
}

function togglePin() {
    isPinned = !isPinned;
    refPin.classList.toggle('active', isPinned);
    refPanel.classList.toggle('pinned', isPinned);
    document.body.classList.toggle('ref-pinned', isPinned);
    
    if (isPinned) refOverlay.classList.remove('open');
    else if (refPanel.classList.contains('open') && window.innerWidth < 1200) refOverlay.classList.add('open');
}

function renderReference(filterText = '') {
    if (!refContent) return;
    refContent.innerHTML = '';
    
    const term = filterText.toLowerCase();
    
    const groups = {};
    knownData.forEach(item => {
        // Filter logic (name, prefix, desc)
        if (term) {
            const match = item.name.toLowerCase().includes(term) || 
                          item.prefix.toLowerCase().includes(term) || 
                          (item.desc && item.desc.toLowerCase().includes(term));
            if (!match) return;
        }
        
        const cat = item.category || "Other";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });

    for (const [group, items] of Object.entries(groups)) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'ref-group';
        
        const h3 = document.createElement('h3');
        h3.textContent = group;
        groupDiv.appendChild(h3);
        
        items.forEach(ex => {
            const item = document.createElement('div');
            item.className = 'ref-item';
            
            let addrVal = ex.prefix;
            if (ex.prefix.endsWith('/128')) {
                addrVal = ex.prefix.replace('/128', '');
            }

            item.onclick = () => {
                inputEl.value = addrVal;
                analyze(addrVal);
                if (!isPinned && window.innerWidth < 1200) {
                    closeReference();
                }
            };

            const addrSpan = document.createElement('div');
            addrSpan.className = 'ref-addr';
            addrSpan.textContent = addrVal;

            const descSpan = document.createElement('div');
            descSpan.className = 'ref-desc';
            descSpan.innerHTML = ex.name;

            item.appendChild(addrSpan);
            item.appendChild(descSpan);
            groupDiv.appendChild(item);
        });
        
        refContent.appendChild(groupDiv);
    }
    
    if (Object.keys(groups).length === 0) {
        refContent.innerHTML = '<div style="padding:20px; text-align:center; color:var(--info-label)">No matches found</div>';
    }
}

function handleInput(e) {
    analyze(e.target.value);
}

function linkify(text) {
    if (!text) return text;
    const rfcRegex = /(RFC\s?(\d+))/gi;
    return text.replace(rfcRegex, '<a href="https://datatracker.ietf.org/doc/html/rfc$2" target="_blank" rel="noopener noreferrer" style="color:var(--primary-color); text-decoration:underline;">$1</a>');
}

function findMatches(addr) {
    const matches = knownData.filter(entry => {
        try {
            const entryAddr = new Address6(entry.prefix);
            if (addr.subnet === '/128' || !addr.subnet) {
                return addr.isInSubnet(entryAddr);
            } else {
                return addr.isInSubnet(entryAddr);
            }
        } catch (e) {
            return false;
        }
    });

    matches.sort((a, b) => {
        const pA = parseInt(a.prefix.split('/')[1] || '128', 10);
        const pB = parseInt(b.prefix.split('/')[1] || '128', 10);
        return pB - pA;
    });

    return matches;
}

function analyze(rawInput) {
    if (!rawInput.trim()) {
        resultsSection.classList.add('hidden');
        return;
    }
    resultsSection.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    resultsContent.innerHTML = '';
    history.replaceState(null, null, '#' + encodeURIComponent(rawInput));
    
    try {
        const parsed = parseInput(rawInput);
        const matches = findMatches(parsed.addr);
        
        const displayMatch = matches.length > 0 ? matches[0] : null;
        const blockMatch = matches.find(m => !m.prefix.endsWith('/128')) || displayMatch;
        
        currentDebugData = {
            rawInput,
            parsedInput: parsed,
            matches: matches,
            displayMatch: displayMatch,
            blockMatch: blockMatch,
            libAddress: {
                address: parsed.addr.address,
                parsedAddress: parsed.addr.parsedAddress,
                valid: true 
            }
        };
        
        const classification = {
            category: displayMatch ? displayMatch.name : 'Unknown',
            meta: displayMatch,
            blockMeta: blockMatch,
            matches: matches,
            multicast: null
        };

        const parts = parsed.addr.parsedAddress;
        const firstHex = parts[0].toLowerCase().padStart(4, '0');
        
        if (firstHex.startsWith('ff')) {
            const flagsHex = parseInt(firstHex[2], 16);
            const scopeHex = parseInt(firstHex[3], 16);
            
            const scopes = { 
                0: 'Reserved', 1: 'Interface-Local', 2: 'Link-Local', 3: 'Realm-Local', 
                4: 'Admin-Local', 5: 'Site-Local', 8: 'Organization-Local', 14: 'Global', 15: 'Reserved' 
            };
            
            const activeFlags = [];
            const flagDetails = [];
            
            if ((flagsHex & 1) > 0) {
                activeFlags.push('Transient (T)');
                flagDetails.push('<strong>Transient (T):</strong> Dynamically assigned, not permanent.');
            } else {
                activeFlags.push('Permanent');
                flagDetails.push('<strong>Permanent:</strong> Well-known, IANA-assigned.');
            }
            if ((flagsHex & 2) > 0) {
                activeFlags.push('Prefix-Based (P)');
                flagDetails.push('<strong>Prefix-Based (P):</strong> Derived from a unicast prefix.');
            }
            if ((flagsHex & 4) > 0) {
                activeFlags.push('Rendezvous (R)');
                flagDetails.push('<strong>Rendezvous (R):</strong> Contains embedded RP address.');
            }
            
            classification.multicast = {
                scope: scopes[scopeHex] || `Unknown (${scopeHex})`,
                flags: activeFlags.join(', '),
                flagsDesc: flagDetails.join('<br>'),
            };
        } else {
            if (!displayMatch) {
                if (parsed.addr.isLinkLocal()) classification.category = 'Link-Local Unicast (Generic)';
            }
        }

        updateDebugDisplay();
        renderResults(parsed, classification);
    } catch (e) {
        errorMessage.textContent = e.message || "Invalid IPv6 Entity";
        errorMessage.classList.remove('hidden');
        console.error(e);
        currentDebugData = { error: e.toString(), stack: e.stack };
        updateDebugDisplay();
    }
}

function parseInput(input) {
    let cleanInput = input.trim();
    let port = null;
    let scope = null;
    const bracketMatch = cleanInput.match(/^\[(.*?)\](?::(\d+))?$/);
    if (bracketMatch) {
        cleanInput = bracketMatch[1];
        if (bracketMatch[2]) port = bracketMatch[2];
    }
    if (cleanInput.includes('%')) {
        const parts = cleanInput.split('%');
        cleanInput = parts[0];
        scope = parts[1];
    }
    let addr = new Address6(cleanInput);
    let type = 'IPv6';
    return { original: input, cleanInput, addr, type, port, scope };
}

function renderResults(data, classification) {
    const { addr, type, port, scope } = data;
    
    const basicInfo = [
        { label: 'Valid', value: true, isBool: true },
        { label: 'Address', value: addr.address },
    ];

    if (addr.subnet) {
        const prefix = parseInt(addr.subnet.substring(1), 10);
        let structureVal = 'Network Subnet';
        let structureDesc = '<strong>Network Block</strong><br>Represents a range of IP addresses.';
        if (prefix === 128) {
            structureVal = 'Single Host';
            structureDesc = '<strong>Single Device</strong><br>This address represents one specific interface/device.';
        }
        basicInfo.push({ label: 'Structure', value: structureVal, valueTooltip: structureDesc });
    }
    
    if (port) basicInfo.push({ label: 'Port', value: port });
    if (scope) basicInfo.push({ label: 'Scope ID', value: scope });
    
    try { basicInfo.push({ label: 'Standard Form', value: addr.correctForm() }); } catch(e){}
    
    if (addr.subnet) {
        const prefix = parseInt(addr.subnet.substring(1), 10);
        let subnetDesc = `<strong>CIDR Prefix</strong><br>The first ${prefix} bits identify the network.`;
        if (prefix === 128) subnetDesc += '<br><br><strong>/128:</strong> Single Host';
        if (prefix === 64) subnetDesc += '<br><br><strong>/64:</strong> Standard LAN';
        if (prefix === 48) subnetDesc += '<br><br><strong>/48:</strong> Standard Site';
        if (prefix === 32) subnetDesc += '<br><br><strong>/32:</strong> ISP Block';
        basicInfo.push({ label: 'Subnet Mask', value: addr.subnet, valueTooltip: subnetDesc });
    }
    createResultGroup('Basic Information', basicInfo);

    const classRows = [];
    const meta = classification.meta;
    const blockMeta = classification.blockMeta;

    if (classification.category !== 'Unknown') {
        let catTooltip = meta ? linkify(meta.desc) : 'No detailed description available.';
        
        classRows.push({ 
            label: 'Category', 
            value: classification.category,
            valueTooltip: catTooltip 
        });

        if (blockMeta) {
            if (blockMeta.prefix) {
                classRows.push({ label: 'Reserved Block', value: blockMeta.prefix });
                
                const match = blockMeta.prefix.match(/\/(\d+)/);
                if (match && match[1]) {
                    const prefixNum = parseInt(match[1], 10);
                    const capacity = 2n ** (128n - BigInt(prefixNum));
                    
                    let breakdownHtml = `<strong>Subnet Potential:</strong><ul style="padding-left:15px; margin:5px 0;">`;
                    const standards = [32, 48, 56, 64];
                    let shown = 0;
                    standards.forEach(std => {
                        if (prefixNum < std) {
                            const count = 2n ** (BigInt(std) - BigInt(prefixNum));
                            let label = '';
                            let subInfo = '';
                            if (std === 32) { label = 'ISPs'; subInfo = `Each /32 has 65,536 /48s`; } 
                            else if (std === 48) { label = 'Sites'; subInfo = `Each /48 has 65,536 /64s`; } 
                            else if (std === 56) { label = 'Allocations'; subInfo = `Each /56 has 256 /64s`; } 
                            else if (std === 64) { label = 'LANs'; subInfo = 'Standard single subnet'; }

                            breakdownHtml += `<li style="margin-bottom:4px;"><strong>/${std}:</strong> ${count.toLocaleString()} (${label})`;
                            if (subInfo) breakdownHtml += `<br><span style="font-size:0.85em; opacity:0.8; margin-left:10px;">↳ ${subInfo}</span>`;
                            breakdownHtml += `</li>`;
                            shown++;
                        }
                    });
                    if (shown === 0) breakdownHtml += `<li>Single Block (/${prefixNum})</li>`;
                    breakdownHtml += '</ul>';

                    classRows.push({ 
                        label: 'Block Capacity', 
                        value: capacity.toLocaleString(),
                        valueTooltip: breakdownHtml
                    });
                }
            }

            if (blockMeta.rfc && blockMeta.rfc !== 'N/A') {
                classRows.push({ 
                    label: 'Defined in', 
                    value: blockMeta.rfc, 
                    valueHTML: linkify(blockMeta.rfc),
                    valueTooltip: linkify(`See <strong>${blockMeta.rfc}</strong> for details.`) 
                });
            }
        }
    }
    
    if (classification.multicast) {
        classRows.push({ label: 'Multicast Scope', value: classification.multicast.scope });
        classRows.push({ 
            label: 'Multicast Flags', 
            value: classification.multicast.flags,
            valueTooltip: linkify(classification.multicast.flagsDesc)
        });
    }
    
    if (classRows.length > 0) {
        createResultGroup('Classification', classRows);
    }

    const formats = [];
    try { formats.push({ label: 'Full Form', value: addr.parsedAddress.map(part => part.padStart(4, '0')).join(':') }); } catch(e){}
    try { const val = typeof addr.bigInt === 'function' ? addr.bigInt() : addr.bigInteger(); formats.push({ label: 'Integer Value', value: val.toString() }); } catch(e){}
    if (addr.parsedAddress) formats.push({ label: 'Parsed Parts', value: addr.parsedAddress.join(':') });
    if (addr.is4()) formats.push({ label: 'IPv4 Address', value: addr.to4().address });
    createResultGroup('Structure & Formats', formats);

    const isMulticast = classification.category.includes('Multicast') || (meta && meta.type === 'multicast') || classification.multicast !== null;
    const isLinkLocal = (meta && meta.category && meta.category.includes('Local')) || (isMulticast && classification.multicast && classification.multicast.scope.includes('Link-Local'));
    
    const detailed = [
        { label: 'Link Local', value: isLinkLocal || addr.isLinkLocal(), isBool: true },
        { label: 'Multicast', value: isMulticast || addr.isMulticast(), isBool: true },
        { label: 'Loopback', value: addr.isLoopback(), isBool: true },
        { label: 'Unique Local', value: classification.category.includes('Unique Local'), isBool: true },
        { label: 'Unspecified', value: classification.category === 'Unspecified', isBool: true },
        { label: 'Teredo', value: addr.isTeredo(), isBool: true },
        { label: 'V4 Mapped', value: addr.is4(), isBool: true },
        { label: '6to4', value: addr.is6to4(), isBool: true },
        { label: 'Canonical', value: addr.isCanonical(), isBool: true },
    ];
    createResultGroup('Flags & Attributes', detailed);

    try {
        const startAddr = addr.startAddress();
        const endAddr = addr.endAddress();
        if (startAddr.correctForm() !== endAddr.correctForm()) {
            const range = [ 
                { label: 'Start Address', value: startAddr.correctForm() }, 
                { label: 'Start (Full)', value: startAddr.parsedAddress.map(p => p.padStart(4, '0')).join(':') }, 
                { label: 'End Address', value: endAddr.correctForm() }, 
                { label: 'End (Full)', value: endAddr.parsedAddress.map(p => p.padStart(4, '0')).join(':') } 
            ];
            
            const prefix = parseInt(addr.subnet.substring(1), 10);
            if (!isNaN(prefix)) {
                range.push({ label: 'Total Addresses', value: (2n ** (128n - BigInt(prefix))).toLocaleString() });
                
                if (prefix < 48) {
                    const c48 = 2n ** (48n - BigInt(prefix));
                    range.push({ label: '/48 Sites', value: c48.toLocaleString(), valueTooltip: `<strong>Enterprise Sites</strong><br>This block contains <strong>${c48.toLocaleString()}</strong> standard /48 sites.<br><br>Each /48 site contains <strong>65,536</strong> /64 LANs.<br>Total capacity: <strong>${(c48 * 65536n).toLocaleString()}</strong> LANs.` });
                }
                if (prefix < 56) range.push({ label: '/56 Allocations', value: (2n ** (56n - BigInt(prefix))).toLocaleString(), valueTooltip: `<strong>Small Sites / ISPs</strong><br>This block contains <strong>${(2n ** (56n - BigInt(prefix))).toLocaleString()}</strong> /56 allocations.<br><br>Each /56 contains <strong>256</strong> /64 LANs.` });
                if (prefix < 64) range.push({ label: '/64 Subnets', value: (2n ** (64n - BigInt(prefix))).toLocaleString(), valueTooltip: `<strong>Standard LANs</strong><br>This block contains <strong>${(2n ** (64n - BigInt(prefix))).toLocaleString()}</strong> /64 subnets.<br>This is the standard unit for a single network segment (VLAN/Wi-Fi).` });
            }
            createResultGroup('Network Range', range);
        }
    } catch(e) {}
}

function showTooltip(text, target) {
    tooltip.innerHTML = text;
    tooltip.classList.remove('hidden');
    requestAnimationFrame(() => {
        tooltip.classList.add('visible');
        const r = target.getBoundingClientRect();
        const tr = tooltip.getBoundingClientRect();
        let t = r.top - tr.height - 10;
        let l = r.left - (tr.width / 2) + (r.width / 2);
        if (t < 10) t = r.bottom + 10;
        if (l < 10) l = 10;
        if (l + tr.width > window.innerWidth - 10) l = window.innerWidth - tr.width - 10;
        tooltip.style.top = `${t}px`;
        tooltip.style.left = `${l}px`;
    });
    activeTarget = target;
}

function hideTooltip() {
    tooltip.classList.remove('visible');
    tooltip.classList.add('hidden');
    activeTarget = null;
}

function createResultGroup(title, rows) {
    const group = document.createElement('div');
    group.className = 'result-group';
    const h4 = document.createElement('div');
    h4.className = 'group-title';
    h4.textContent = title;
    const content = document.createElement('div');
    content.className = 'group-content';
    h4.onclick = () => { h4.classList.toggle('collapsed'); content.classList.toggle('collapsed'); };
    group.appendChild(h4);
    rows.forEach(row => {
        const wrap = document.createElement('div');
        wrap.className = 'row-wrapper';
        const div = document.createElement('div');
        div.className = 'data-row';
        const lCont = document.createElement('span');
        lCont.className = 'label-container';
        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = row.label;
        lCont.appendChild(label);
        const desc = descriptions[row.label];
        if (desc) {
            const icon = document.createElement('span');
            icon.className = 'info-icon';
            icon.textContent = 'ⓘ';
            lCont.appendChild(icon);
            icon.addEventListener('mouseenter', () => showTooltip(desc, icon));
            icon.addEventListener('mouseleave', () => hideTooltip());
            icon.addEventListener('click', (e) => { e.stopPropagation(); if (activeTarget === icon && tooltip.classList.contains('visible')) hideTooltip(); else showTooltip(desc, icon); });
        }
        const val = document.createElement('span');
        val.className = 'value';
        
        if (row.valueHTML) {
            val.innerHTML = row.valueHTML;
        } else if (row.isBool) {
            val.textContent = row.value ? 'Yes' : 'No';
            val.classList.add(row.value ? 'bool-true' : 'bool-false');
        } else {
            val.textContent = row.value;
            const vDesc = row.valueTooltip || descriptions[row.value];
            if (vDesc) {
                val.classList.add('value-with-info');
                val.style.cursor = 'help';
                val.style.textDecoration = 'underline dotted';
                val.addEventListener('mouseenter', () => showTooltip(vDesc, val));
                val.addEventListener('mouseleave', () => hideTooltip());
                val.addEventListener('click', (e) => { e.stopPropagation(); if (activeTarget === val && tooltip.classList.contains('visible')) hideTooltip(); else showTooltip(vDesc, val); });
            }
        }
        div.appendChild(lCont);
        div.appendChild(val);
        wrap.appendChild(div);
        content.appendChild(wrap);
    });
    group.appendChild(content);
    resultsContent.appendChild(group);
}

document.addEventListener('click', (e) => { if (!e.target.matches('.info-icon') && !e.target.closest('#global-tooltip') && !e.target.matches('.value-with-info')) hideTooltip(); });
window.addEventListener('scroll', () => { if(activeTarget) hideTooltip(); });
window.addEventListener('resize', () => { if(activeTarget) hideTooltip(); });

init();