export type DataLayer = "demographic" | "biometric" | "full";

export interface NIMCApiResponse {
  data: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    mobile: string;
    image?: string;
    signature?: string;
    address: {
      addressLine: string;
      town: string;
      lga: string;
      state: string;
    };
    // ... other fields
  };
}

export interface FilteredVerificationData {
  // Always included (if available)
  fullName: string;
  dateOfBirth: string;
  phoneFromNimc: string;
  gender: string;
  
  // Conditional fields based on data layer
  photoUrl?: string;
  signatureUrl?: string;
  addressLine?: string;
  town?: string;
  lga?: string;
  state?: string;
  
  // Metadata
  dataLayer: DataLayer;
  verificationId: string;
  timestamp: Date;
}

export class DataLayerFilter {
  /**
   * Filter NIMC API response based on selected data layer
   */
  static filterResponse(
    apiResponse: NIMCApiResponse,
    selectedLayer: DataLayer,
    verificationId: string
  ): FilteredVerificationData {
    const data = apiResponse.data;
    
    // Base demographic data (always included)
    const result: FilteredVerificationData = {
      fullName: [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .join(" ")
        .trim(),
      dateOfBirth: data.dateOfBirth,
      phoneFromNimc: data.mobile,
      gender: data.gender,
      dataLayer: selectedLayer,
      verificationId,
      timestamp: new Date(),
    };

    // Add biometric data if requested
    if (selectedLayer === "biometric" || selectedLayer === "full") {
      if (data.image) {
        result.photoUrl = data.image;
      }
      if (data.signature) {
        result.signatureUrl = data.signature;
      }
    }

    // Add full address data if requested
    if (selectedLayer === "full") {
      result.addressLine = data.address.addressLine;
      result.town = data.address.town;
      result.lga = data.address.lga;
      result.state = data.address.state;
    }

    return result;
  }

  /**
   * Get data layer description for UI
   */
  static getLayerDescription(layer: DataLayer): {
    title: string;
    description: string;
    fields: string[];
    price: number;
  } {
    switch (layer) {
      case "demographic":
        return {
          title: "Demographic Data",
          description: "Basic identity information",
          fields: ["Full Name", "Date of Birth", "Phone Number", "Gender"],
          price: 500, // ₦5.00
        };
      
      case "biometric":
        return {
          title: "Biometric Data", 
          description: "Identity verification with photo",
          fields: ["Full Name", "Date of Birth", "Phone Number", "Gender", "Photo", "Signature"],
          price: 750, // ₦7.50
        };
      
      case "full":
        return {
          title: "Complete Profile",
          description: "All available information",
          fields: [
            "Full Name", "Date of Birth", "Phone Number", "Gender", 
            "Photo", "Signature", "Full Address", "LGA", "State"
          ],
          price: 1000, // ₦10.00
        };
      
      default:
        return {
          title: "Unknown",
          description: "",
          fields: [],
          price: 500,
        };
    }
  }

  /**
   * Validate data layer selection
   */
  static isValidDataLayer(layer: string): layer is DataLayer {
    return ["demographic", "biometric", "full"].includes(layer);
  }

  /**
   * Get printable document data based on layer
   */
  static getPrintableData(
    filteredData: FilteredVerificationData,
    ninMasked: string,
    sessionId: string
  ) {
    const baseData = {
      documentId: sessionId,
      verificationDate: filteredData.timestamp.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      ninMasked,
      dataLayer: filteredData.dataLayer,
      
      // Always included
      fullName: filteredData.fullName,
      dateOfBirth: filteredData.dateOfBirth,
      phoneNumber: filteredData.phoneFromNimc,
      gender: filteredData.gender,
    };

    // Add conditional fields based on data layer
    const conditionalData: any = {};

    if (filteredData.dataLayer === "biometric" || filteredData.dataLayer === "full") {
      if (filteredData.photoUrl) {
        conditionalData.photoUrl = filteredData.photoUrl;
      }
      if (filteredData.signatureUrl) {
        conditionalData.signatureUrl = filteredData.signatureUrl;
      }
    }

    if (filteredData.dataLayer === "full") {
      conditionalData.address = {
        addressLine: filteredData.addressLine,
        town: filteredData.town,
        lga: filteredData.lga,
        state: filteredData.state,
      };
    }

    return {
      ...baseData,
      ...conditionalData,
      layerInfo: this.getLayerDescription(filteredData.dataLayer),
    };
  }

  /**
   * Generate audit log entry for data access
   */
  static generateAuditEntry(
    phoneNumber: string,
    ninMasked: string,
    dataLayer: DataLayer,
    sessionId: string,
    ipAddress?: string
  ) {
    return {
      sessionId,
      phoneNumber,
      ninMasked,
      dataLayer,
      accessedFields: this.getLayerDescription(dataLayer).fields,
      timestamp: new Date(),
      ipAddress,
      action: "data_accessed",
    };
  }
}