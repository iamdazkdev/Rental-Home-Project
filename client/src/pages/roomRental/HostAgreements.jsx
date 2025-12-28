import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FileText, CheckCircle, DollarSign, Clock, AlertCircle, Eye } from "lucide-react";
import Navbar from "../../components/Navbar";
import "../../styles/HostAgreements.scss";

const HostAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    fetchAgreements();
  }, [user]);

  const fetchAgreements = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/agreements/host/${user._id}`
      );
      const data = await response.json();
      if (data.success) {
        setAgreements(data.agreements);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching agreements:", error);
      setLoading(false);
    }
  };

  const handleConfirmAgreement = async (agreementId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/room-rental/agreements/${agreementId}/host-confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Agreement confirmed successfully!");
        fetchAgreements();
        setSelectedAgreement(null);
      }
    } catch (error) {
      console.error("Error confirming agreement:", error);
      alert("Failed to confirm agreement");
    }
  };

  const filteredAgreements = agreements.filter((agreement) => {
    if (filter === "all") return true;
    if (filter === "draft") return agreement.status === "DRAFT";
    if (filter === "active") return agreement.status === "ACTIVE";
    if (filter === "terminated") return agreement.status === "TERMINATED";
    return true;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { color: "#ffc107", label: "Draft" },
      ACTIVE: { color: "#28a745", label: "Active" },
      TERMINATED: { color: "#dc3545", label: "Terminated" },
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="host-agreements">
          <div className="loading">Loading agreements...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="host-agreements">
        <div className="agreements-header">
          <FileText size={48} />
          <h1>Rental Agreements</h1>
          <p>Manage and confirm rental agreements with your tenants</p>
        </div>

        <div className="filter-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All ({agreements.length})
          </button>
          <button
            className={filter === "draft" ? "active" : ""}
            onClick={() => setFilter("draft")}
          >
            Draft ({agreements.filter((a) => a.status === "DRAFT").length})
          </button>
          <button
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            Active ({agreements.filter((a) => a.status === "ACTIVE").length})
          </button>
          <button
            className={filter === "terminated" ? "active" : ""}
            onClick={() => setFilter("terminated")}
          >
            Terminated ({agreements.filter((a) => a.status === "TERMINATED").length})
          </button>
        </div>

        {filteredAgreements.length === 0 ? (
          <div className="no-agreements">
            <FileText size={64} />
            <h3>No Agreements Found</h3>
            <p>You don't have any agreements in this category yet.</p>
          </div>
        ) : (
          <div className="agreements-grid">
            {filteredAgreements.map((agreement) => (
              <div key={agreement._id} className="agreement-card">
                <div className="card-header">
                  <div className="tenant-info">
                    <h3>{agreement.tenantId?.firstName} {agreement.tenantId?.lastName}</h3>
                    <p>{agreement.tenantId?.email}</p>
                  </div>
                  {getStatusBadge(agreement.status)}
                </div>

                <div className="agreement-details">
                  <div className="detail-row">
                    <FileText size={18} />
                    <span>{agreement.roomId?.title || "Room Details"}</span>
                  </div>
                  <div className="detail-row">
                    <DollarSign size={18} />
                    <span>Monthly Rent: {formatCurrency(agreement.rentAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <DollarSign size={18} />
                    <span>Deposit: {formatCurrency(agreement.depositAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <Clock size={18} />
                    <span>Notice Period: {agreement.noticePeriod} days</span>
                  </div>
                </div>

                <div className="signature-status">
                  <div className="signature-item">
                    {agreement.agreedByTenantAt ? (
                      <CheckCircle size={18} color="#28a745" />
                    ) : (
                      <AlertCircle size={18} color="#ffc107" />
                    )}
                    <span>
                      Tenant: {agreement.agreedByTenantAt ? "Signed" : "Pending"}
                    </span>
                  </div>
                  <div className="signature-item">
                    {agreement.agreedByHostAt ? (
                      <CheckCircle size={18} color="#28a745" />
                    ) : (
                      <AlertCircle size={18} color="#ffc107" />
                    )}
                    <span>
                      Host: {agreement.agreedByHostAt ? "Signed" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="view-btn"
                    onClick={() => setSelectedAgreement(agreement)}
                  >
                    <Eye size={18} />
                    View Details
                  </button>
                  {agreement.status === "DRAFT" && agreement.agreedByTenantAt && !agreement.agreedByHostAt && (
                    <button
                      className="confirm-btn"
                      onClick={() => handleConfirmAgreement(agreement._id)}
                    >
                      <CheckCircle size={18} />
                      Confirm Agreement
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedAgreement && (
          <div className="agreement-modal" onClick={() => setSelectedAgreement(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Agreement Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedAgreement(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="agreement-section">
                  <h3>Parties</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Tenant:</strong>
                      <p>
                        {selectedAgreement.tenantId?.firstName}{" "}
                        {selectedAgreement.tenantId?.lastName}
                      </p>
                      <p>{selectedAgreement.tenantId?.email}</p>
                    </div>
                    <div>
                      <strong>Host:</strong>
                      <p>
                        {selectedAgreement.hostId?.firstName}{" "}
                        {selectedAgreement.hostId?.lastName}
                      </p>
                      <p>{selectedAgreement.hostId?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="agreement-section">
                  <h3>Property Details</h3>
                  <p><strong>Room:</strong> {selectedAgreement.roomId?.title}</p>
                </div>

                <div className="agreement-section">
                  <h3>Financial Terms</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Monthly Rent:</strong>
                      <p>{formatCurrency(selectedAgreement.rentAmount)}</p>
                    </div>
                    <div>
                      <strong>Security Deposit:</strong>
                      <p>{formatCurrency(selectedAgreement.depositAmount)}</p>
                    </div>
                    <div>
                      <strong>Payment Method:</strong>
                      <p>{selectedAgreement.paymentMethod}</p>
                    </div>
                    <div>
                      <strong>Notice Period:</strong>
                      <p>{selectedAgreement.noticePeriod} days</p>
                    </div>
                  </div>
                </div>

                {selectedAgreement.houseRules && (
                  <div className="agreement-section">
                    <h3>House Rules</h3>
                    <p className="rules-text">{selectedAgreement.houseRules}</p>
                  </div>
                )}

                <div className="agreement-section">
                  <h3>Status & Signatures</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Agreement Status:</strong>
                      <p>{selectedAgreement.status}</p>
                    </div>
                    <div>
                      <strong>Tenant Signed:</strong>
                      <p>
                        {selectedAgreement.agreedByTenantAt
                          ? new Date(selectedAgreement.agreedByTenantAt).toLocaleString()
                          : "Not signed yet"}
                      </p>
                    </div>
                    <div>
                      <strong>Host Signed:</strong>
                      <p>
                        {selectedAgreement.agreedByHostAt
                          ? new Date(selectedAgreement.agreedByHostAt).toLocaleString()
                          : "Not signed yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedAgreement.status === "DRAFT" &&
               selectedAgreement.agreedByTenantAt &&
               !selectedAgreement.agreedByHostAt && (
                <div className="modal-footer">
                  <button
                    className="confirm-agreement-btn"
                    onClick={() => handleConfirmAgreement(selectedAgreement._id)}
                  >
                    <CheckCircle size={18} />
                    Confirm This Agreement
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HostAgreements;

