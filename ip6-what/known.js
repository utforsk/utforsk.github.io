// Centralized IPv6 Knowledge Base
// Sources: IANA IPv6 Special-Purpose Address Registry, RFC 6890, RFC 4291, RFC 2375, RFC 3849, RFC 9602, etc.

export const knownData = [
    // --- Unspecified & Loopback ---
    { prefix: "::/128", name: "Unspecified Address", desc: "The address <code>::</code> indicates the absence of an address. It is used by a device while it is initializing and has not yet acquired a valid address.", rfc: "RFC 4291", category: "Common & Documentation", type: "unspecified" },
    { prefix: "::1/128", name: "Loopback Address", desc: "The address <code>::1</code> is used by a node to send packets to itself. It is treated as having Link-Local scope and is never sent on a physical link.", rfc: "RFC 4291", category: "Common & Documentation", type: "loopback" },

    // --- Documentation ---
    { prefix: "2001:db8::/32", name: "Documentation Prefix (Standard)", desc: "Addresses in this block are reserved for use in documentation and example code. They should never be used in a production network.", rfc: "RFC 3849", category: "Common & Documentation", type: "unicast" },
    { prefix: "2001:db8::1/128", name: "Documentation Example", desc: "A specific example address within the standard documentation prefix.", rfc: "RFC 3849", category: "Common & Documentation", type: "unicast" },
    { prefix: "3fff::/20", name: "Documentation Prefix (Expanded)", desc: "An additional block reserved for documentation purposes, allowing for larger example topologies.", rfc: "RFC 9637 (July 2024)", category: "Common & Documentation", type: "unicast" },

    // --- Special & Reserved Prefixes ---
    { prefix: "100::/64", name: "Discard Prefix", desc: "A prefix reserved for use in discarding (dropping) packets. It is used for remotely triggered black hole filtering.", rfc: "RFC 6666", category: "Special & Reserved", type: "unicast" },
    { prefix: "64:ff9b::/96", name: "NAT64 Well-Known Prefix", desc: "Used for synthesizing IPv6 addresses from IPv4 addresses in NAT64 translation (IPv6-only client to IPv4-only server).", rfc: "RFC 6052", category: "Special & Reserved", type: "unicast" },
    { prefix: "64:ff9b:1::/48", name: "Local-Use NAT64", desc: "Reserved for Local-Use IPv4/IPv6 Translation. Similar to the well-known prefix but for local deployments.", rfc: "RFC 8215", category: "Special & Reserved", type: "unicast" },
    { prefix: "2001::/23", name: "IETF Protocol Assignments", desc: "Block for special protocol assignments.", rfc: "RFC 2928", category: "Special & Reserved", type: "unicast" },
    { prefix: "2001:1::1/128", name: "Port Control Protocol (PCP) Anycast", desc: "Anycast address for the Port Control Protocol (PCP), allowing clients to control how upstream NATs/firewalls handle their traffic.", rfc: "RFC 7723", category: "Special & Reserved", type: "anycast" },
    { prefix: "2001:1::2/128", name: "TURN Anycast", desc: "Anycast address for Traversal Using Relays around NAT (TURN), used for discovering TURN servers.", rfc: "RFC 8155", category: "Special & Reserved", type: "anycast" },
    { prefix: "2001:1::3/128", name: "DNS-SD SRP Anycast", desc: "Anycast address for DNS-Based Service Discovery (DNS-SD) Service Registration Protocol (SRP).", rfc: "RFC 9665 (April 2024)", category: "Special & Reserved", type: "anycast" },
    { prefix: "2001:2::/48", name: "Benchmarking", desc: "Reserved for use in network performance benchmarking documentation and testing (BMWG).", rfc: "RFC 5180", category: "Special & Reserved", type: "unicast" },
    { prefix: "2001:3::/32", name: "Automatic Multicast Tunneling (AMT)", desc: "Reserved for Automatic Multicast Tunneling (AMT) relays and gateways.", rfc: "RFC 7450", category: "Special & Reserved", type: "anycast" },
    { prefix: "2001:4:112::/48", name: "AS112-v6", desc: "Used for Anycast sinking of reverse DNS queries for private networks to protect the root servers.", rfc: "RFC 7535", category: "Special & Reserved", type: "anycast" },
    { prefix: "2001:5::/32", name: "EID Space", desc: "Prefix for Locator/ID Separation Protocol (LISP) Endpoint ID (EID) space. Experimental.", rfc: "RFC 7954", category: "Special & Reserved", type: "unicast" },
    { prefix: "2001:10::/28", name: "ORCHIDv2", desc: "Overlay Routable Cryptographic Hash Identifiers (Generation 2). Used for cryptographic identifiers that look like IPv6 addresses (e.g. HIP).", rfc: "RFC 7343", category: "Special & Reserved", type: "unicast" },
    { prefix: "2001:20::/28", name: "ORCHID (Legacy)", desc: "Original ORCHID prefix. Deprecated in favor of ORCHIDv2.", rfc: "RFC 4843", category: "Special & Reserved", type: "unicast" },
    { prefix: "2001:30::/28", name: "Drone Remote ID", desc: "Drone Remote ID Protocol Entity Tags. Used for identification of drones/UAVs.", rfc: "RFC 9374", category: "Special & Reserved", type: "unicast" },
    { prefix: "5f00::/16", name: "Segment Routing (SRv6) SIDs", desc: "Block reserved for Segment Routing over IPv6 (SRv6) Segment Identifiers (SIDs).", rfc: "RFC 9602 (April 2024)", category: "Special & Reserved", type: "unicast" },

    // --- Transition ---
    { prefix: "2002::/16", name: "6to4", desc: "IPv4/IPv6 transition.", rfc: "RFC 3056", category: "Transition", type: "unicast" },
    { prefix: "2001:0000::/32", name: "Teredo", desc: "NAT traversal tunneling.", rfc: "RFC 4380", category: "Transition", type: "unicast" },
    { prefix: "::ffff:0:0/96", name: "IPv4-Mapped", desc: "Internal OS representation of IPv4.", rfc: "RFC 4291", category: "Transition", type: "unicast" },
    { prefix: "::/96", name: "IPv4-Compatible", desc: "Deprecated tunneling.", rfc: "RFC 4291 (Deprecated)", category: "Transition", type: "unicast" },

    // --- Local ---
    { prefix: "fe80::/10", name: "Link-Local", desc: "Single network segment communication.", rfc: "RFC 4291", category: "Local", type: "unicast" },
    { prefix: "fc00::/7", name: "Unique Local (ULA)", desc: "Private local network.", rfc: "RFC 4193", category: "Local", type: "unicast" },
    { prefix: "fec0::/10", name: "Site-Local", desc: "Deprecated site-wide addressing.", rfc: "RFC 3879 (Deprecated)", category: "Local", type: "unicast" },

    // --- Multicast: Basic ---
    { prefix: "ff00::/8", name: "Multicast", desc: "Identifier for a set of interfaces.", rfc: "RFC 4291", category: "Multicast - Basic", type: "multicast" },
    // Interface-Local
    { prefix: "ff01::1/128", name: "All Nodes (Interface)", desc: "Interface-Local loopback.", rfc: "RFC 4291", category: "Multicast - Basic", type: "multicast" },
    { prefix: "ff01::2/128", name: "All Routers (Interface)", desc: "Interface-Local.", rfc: "RFC 4291", category: "Multicast - Basic", type: "multicast" },
    // Link-Local
    { prefix: "ff02::1/128", name: "All Nodes (Link)", desc: "Reach all devices on wire.", rfc: "RFC 4291", category: "Multicast - Basic", type: "multicast" },
    { prefix: "ff02::2/128", name: "All Routers (Link)", desc: "Reach all routers on wire.", rfc: "RFC 4291", category: "Multicast - Basic", type: "multicast" },
    // Site-Local
    { prefix: "ff05::2/128", name: "All Routers (Site)", desc: "Reach all routers in site.", rfc: "RFC 4291", category: "Multicast - Basic", type: "multicast" },

    // --- Multicast: IoT ---
    { prefix: "ff02::fa/128", name: "All Matter Nodes (Link)", desc: "Matter IoT Protocol.", rfc: "CSA", category: "Multicast - IoT", type: "multicast" },
    { prefix: "ff05::fa/128", name: "All Matter Nodes (Site)", desc: "Matter IoT Protocol.", rfc: "CSA", category: "Multicast - IoT", type: "multicast" },
    { prefix: "ff02::fd/128", name: "All CoAP Nodes (Link)", desc: "Constrained Application Protocol.", rfc: "RFC 7252", category: "Multicast - IoT", type: "multicast" },
    { prefix: "ff05::fd/128", name: "All CoAP Nodes (Site)", desc: "Constrained Application Protocol.", rfc: "RFC 7252", category: "Multicast - IoT", type: "multicast" },
    { prefix: "ff02::fb/128", name: "mDNS", desc: "Multicast DNS (Bonjour/Avahi).", rfc: "RFC 6762", category: "Multicast - IoT", type: "multicast" },
    { prefix: "ff02::c/128", name: "SSDP", desc: "Simple Service Discovery Protocol (UPnP).", rfc: "UPnP", category: "Multicast - IoT", type: "multicast" },
    { prefix: "ff02::f/128", name: "UPnP", desc: "Universal Plug and Play.", rfc: "UPnP", category: "Multicast - IoT", type: "multicast" },
    { prefix: "ff02::1:3/128", name: "LLMNR", desc: "Link-Local Multicast Name Resolution.", rfc: "RFC 4795", category: "Multicast - IoT", type: "multicast" },

    // --- Multicast: Routing ---
    { prefix: "ff02::9/128", name: "RIPng Routers", desc: "Routing Information Protocol.", rfc: "RFC 2080", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::a/128", name: "EIGRP Routers", desc: "Enhanced Interior Gateway Routing Protocol.", rfc: "RFC 7868", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::d/128", name: "PIM Routers", desc: "Protocol Independent Multicast.", rfc: "RFC 7761", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::5/128", name: "OSPFv3 All Routers", desc: "Open Shortest Path First.", rfc: "RFC 5340", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::6/128", name: "OSPFv3 DRs", desc: "OSPF Designated Routers.", rfc: "RFC 5340", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::4/128", name: "DVMRP Routers", desc: "Distance Vector Multicast.", rfc: "RFC 1075", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::12/128", name: "VRRP", desc: "Virtual Router Redundancy Protocol.", rfc: "RFC 5798", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::16/128", name: "MLDv2 Reports", desc: "Multicast Listener Discovery.", rfc: "RFC 3810", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::1a/128", name: "RPL Nodes", desc: "Routing Protocol for Low-Power Networks.", rfc: "RFC 6550", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::1:6/128", name: "Babel Routers", desc: "Babel Routing Protocol.", rfc: "RFC 8966", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::6b/128", name: "PTP (Peer Delay)", desc: "Precision Time Protocol.", rfc: "IEEE 1588", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::fc/128", name: "MPL Forwarders", desc: "Multicast Protocol for Low-Power and Lossy Networks.", rfc: "RFC 7731", category: "Multicast - Routing", type: "multicast" },
    { prefix: "ff02::109/128", name: "HAIP", desc: "High Availability IP.", rfc: "N/A", category: "Multicast - Routing", type: "multicast" },

    // --- Multicast: Infrastructure ---
    { prefix: "ff02::1:2/128", name: "DHCPv6 Agents", desc: "All DHCPv6 Servers and Relays.", rfc: "RFC 3315", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff05::1:3/128", name: "DHCPv6 Servers", desc: "Site-Local DHCPv6 Servers.", rfc: "RFC 3315", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff02::101/128", name: "NTP (Link)", desc: "Network Time Protocol.", rfc: "RFC 5905", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff05::101/128", name: "NTP (Site)", desc: "Network Time Protocol.", rfc: "RFC 5905", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff02::152/128", name: "CAPWAP (Control)", desc: "Wireless Access Point Control.", rfc: "RFC 5415", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff02::cca/128", name: "CAPWAP (Discovery)", desc: "Access Controller Discovery.", rfc: "RFC 5415", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff02::108/128", name: "NIS+", desc: "Network Information Service Plus.", rfc: "RFC 3150", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff02::202/128", name: "Sun RPC", desc: "Sun Remote Procedure Call.", rfc: "N/A", category: "Multicast - Service", type: "multicast" },
    { prefix: "ff02::1:4/128", name: "DTCP", desc: "Distributed Transport Control Protocol.", rfc: "RFC 3956", category: "Multicast - Service", type: "multicast" },

    // --- Special Multicast Types ---
    { prefix: "ff02::1:ff00:0/104", name: "Solicited-Node", desc: "Used by NDP for address resolution.", rfc: "RFC 4291", category: "Multicast - Advanced", type: "multicast" },
    { prefix: "ff30::/12", name: "Unicast-Prefix-based", desc: "Multicast derived from unicast prefix.", rfc: "RFC 3306", category: "Multicast - Advanced", type: "multicast" },
    { prefix: "ff70::/12", name: "Embedded-RP", desc: "Embeds Rendezvous Point address.", rfc: "RFC 3956", category: "Multicast - Advanced", type: "multicast" },

    // --- Anycast & Reserved IDs ---
    { prefix: "fdff:ffff:ffff:fffe/128", name: "Mobile IPv6 HA Anycast", desc: "Home Agent Anycast.", rfc: "RFC 2526", category: "Special & Reserved", type: "anycast" },
    { prefix: "fdff:ffff:ffff:ff80/121", name: "Reserved Anycast", desc: "Reserved Anycast Range Base.", rfc: "RFC 2526", category: "Special & Reserved", type: "anycast" },
    
    // --- Public DNS Examples ---
    { prefix: "2001:4860:4860::8888/128", name: "Google Public DNS", desc: "Public DNS.", rfc: "N/A", category: "Common & Documentation", type: "unicast" },
    { prefix: "2606:4700:4700::1111/128", name: "Cloudflare Public DNS", desc: "Public DNS.", rfc: "N/A", category: "Common & Documentation", type: "unicast" }
];