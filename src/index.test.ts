import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables before importing
process.env.TWENTY_API_KEY = 'test-api-key';
process.env.TWENTY_BASE_URL = 'https://test.twenty.com';

// Mock the fetch function globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Import after setting up mocks and environment
import { TwentyCRMServer } from './index';

describe('TwentyCRMServer', () => {
  let server: any;

  beforeEach(() => {
    mockFetch.mockReset();
    server = new TwentyCRMServer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GraphQL Request Handler', () => {
    it('should successfully execute a GraphQL query', async () => {
      const mockResponse = {
        data: {
          person: {
            id: '123',
            name: { firstName: 'John', lastName: 'Doe' }
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await server.graphqlRequest('query { person { id } }', { id: '123' });

      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.twenty.com/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should throw error when GraphQL request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(
        server.graphqlRequest('query { person { id } }')
      ).rejects.toThrow('GraphQL request failed (500): Internal Server Error');
    });

    it('should throw error when GraphQL returns errors', async () => {
      const mockResponse = {
        errors: [{ message: 'Person not found' }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await expect(
        server.graphqlRequest('query { person { id } }')
      ).rejects.toThrow('GraphQL errors');
    });
  });

  describe('Person Operations', () => {
    describe('createPerson', () => {
      it('should create a person with required fields only', async () => {
        const mockResponse = {
          data: {
            createPerson: {
              id: '123',
              name: { firstName: 'John', lastName: 'Doe' },
              emails: null,
              phones: null,
              jobTitle: null,
              city: null,
              linkedinLink: null,
              xLink: null,
              companyId: null,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createPerson({
          firstName: 'John',
          lastName: 'Doe'
        });

        expect(result.content[0].text).toContain('Created person: John Doe');
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should create a person with all fields', async () => {
        const mockResponse = {
          data: {
            createPerson: {
              id: '123',
              name: { firstName: 'John', lastName: 'Doe' },
              emails: { primaryEmail: 'john@example.com', additionalEmails: [] },
              phones: {
                primaryPhoneNumber: '1234567890',
                primaryPhoneCountryCode: 'US',
                primaryPhoneCallingCode: '+1'
              },
              jobTitle: 'Developer',
              city: 'New York',
              linkedinLink: { primaryLinkUrl: 'https://linkedin.com/in/johndoe' },
              xLink: { primaryLinkUrl: 'https://x.com/johndoe' },
              companyId: 'comp-123',
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createPerson({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          phoneCountryCode: 'US',
          phoneCallingCode: '+1',
          jobTitle: 'Developer',
          city: 'New York',
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          xUrl: 'https://x.com/johndoe',
          companyId: 'comp-123'
        });

        expect(result.content[0].text).toContain('Created person: John Doe');
        expect(result.content[0].text).toContain('john@example.com');
      });
    });

    describe('getPerson', () => {
      it('should retrieve a person by ID', async () => {
        const mockResponse = {
          data: {
            person: {
              id: '123',
              name: { firstName: 'John', lastName: 'Doe' },
              emails: { primaryEmail: 'john@example.com' },
              phones: { primaryPhoneNumber: '1234567890' },
              jobTitle: 'Developer',
              city: 'New York',
              linkedinLink: { primaryLinkUrl: 'https://linkedin.com/in/johndoe' },
              xLink: { primaryLinkUrl: 'https://x.com/johndoe' },
              companyId: 'comp-123',
              company: { id: 'comp-123', name: 'Acme Corp' },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getPerson('123');

        expect(result.content[0].text).toContain('Person details:');
        expect(result.content[0].text).toContain('john@example.com');
      });
    });

    describe('listPeople', () => {
      it('should list people without filters', async () => {
        const mockResponse = {
          data: {
            people: {
              edges: [
                {
                  node: {
                    id: '123',
                    name: { firstName: 'John', lastName: 'Doe' },
                    emails: { primaryEmail: 'john@example.com' },
                    phones: { primaryPhoneNumber: '1234567890' },
                    jobTitle: 'Developer',
                    city: 'New York',
                    companyId: 'comp-123',
                    company: { id: 'comp-123', name: 'Acme Corp' }
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listPeople({});

        expect(result.content[0].text).toContain('Found 1 people');
      });

      it('should list people with search term', async () => {
        const mockResponse = {
          data: {
            people: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listPeople({ searchTerm: 'John' });

        expect(result.content[0].text).toContain('Found 0 people');
      });

      it('should list people with companyId filter', async () => {
        const mockResponse = {
          data: {
            people: {
              edges: [
                {
                  node: {
                    id: '123',
                    name: { firstName: 'John', lastName: 'Doe' },
                    emails: { primaryEmail: 'john@example.com' },
                    phones: { primaryPhoneNumber: '1234567890' },
                    jobTitle: 'Developer',
                    city: 'New York',
                    companyId: 'comp-123',
                    company: { id: 'comp-123', name: 'Acme Corp' }
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listPeople({ companyId: 'comp-123' });

        expect(result.content[0].text).toContain('Found 1 people');
      });

      it('should indicate when more results are available', async () => {
        const mockResponse = {
          data: {
            people: {
              edges: Array(20).fill({
                node: {
                  id: '123',
                  name: { firstName: 'John', lastName: 'Doe' },
                  emails: { primaryEmail: 'john@example.com' },
                  phones: { primaryPhoneNumber: '1234567890' },
                  jobTitle: 'Developer',
                  city: 'New York',
                  companyId: 'comp-123',
                  company: { id: 'comp-123', name: 'Acme Corp' }
                }
              }),
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listPeople({ limit: 20 });

        expect(result.content[0].text).toContain('(more available)');
      });
    });

    describe('updatePerson', () => {
      it('should update a person with partial fields', async () => {
        const mockResponse = {
          data: {
            updatePerson: {
              id: '123',
              name: { firstName: 'Jane', lastName: 'Doe' },
              emails: { primaryEmail: 'jane@example.com' },
              phones: { primaryPhoneNumber: '9876543210' },
              jobTitle: 'Senior Developer',
              city: 'San Francisco',
              updatedAt: '2024-01-03T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updatePerson({
          id: '123',
          firstName: 'Jane',
          email: 'jane@example.com'
        });

        expect(result.content[0].text).toContain('Updated person');
      });

      it('should handle undefined values correctly', async () => {
        const mockResponse = {
          data: {
            updatePerson: {
              id: '123',
              name: { firstName: 'John', lastName: 'Doe' },
              emails: { primaryEmail: 'john@example.com' },
              phones: { primaryPhoneNumber: '1234567890' },
              jobTitle: '',
              city: 'New York',
              updatedAt: '2024-01-03T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updatePerson({
          id: '123',
          jobTitle: ''
        });

        expect(result.content[0].text).toContain('Updated person');
      });
    });
  });

  describe('Company Operations', () => {
    describe('createCompany', () => {
      it('should create a company with required fields only', async () => {
        const mockResponse = {
          data: {
            createCompany: {
              id: '123',
              name: 'Acme Corp',
              domainName: null,
              address: null,
              employees: null,
              linkedinLink: null,
              xLink: null,
              annualRecurringRevenue: null,
              idealCustomerProfile: false,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createCompany({ name: 'Acme Corp' });

        expect(result.content[0].text).toContain('Created company: Acme Corp');
      });

      it('should create a company with all fields', async () => {
        const mockResponse = {
          data: {
            createCompany: {
              id: '123',
              name: 'Acme Corp',
              domainName: { primaryLinkUrl: 'https://acme.com' },
              address: {
                addressStreet1: '123 Main St',
                addressStreet2: 'Suite 100',
                addressCity: 'San Francisco',
                addressPostcode: '94111',
                addressState: 'CA',
                addressCountry: 'USA'
              },
              employees: 100,
              linkedinLink: { primaryLinkUrl: 'https://linkedin.com/company/acme' },
              xLink: { primaryLinkUrl: 'https://x.com/acmecorp' },
              annualRecurringRevenue: {
                amountMicros: 1000000000000,
                currencyCode: 'USD'
              },
              idealCustomerProfile: true,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createCompany({
          name: 'Acme Corp',
          domainUrl: 'https://acme.com',
          addressStreet1: '123 Main St',
          addressStreet2: 'Suite 100',
          addressCity: 'San Francisco',
          addressPostcode: '94111',
          addressState: 'CA',
          addressCountry: 'USA',
          employees: 100,
          linkedinUrl: 'https://linkedin.com/company/acme',
          xUrl: 'https://x.com/acmecorp',
          annualRecurringRevenue: 1000000,
          currency: 'USD',
          idealCustomerProfile: true
        });

        expect(result.content[0].text).toContain('Created company: Acme Corp');
      });

      it('should convert ARR to micros correctly', async () => {
        const mockResponse = {
          data: {
            createCompany: {
              id: '123',
              name: 'Acme Corp',
              domainName: null,
              address: null,
              employees: null,
              linkedinLink: null,
              xLink: null,
              annualRecurringRevenue: {
                amountMicros: 500000000000,
                currencyCode: 'EUR'
              },
              idealCustomerProfile: false,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await server.createCompany({
          name: 'Acme Corp',
          annualRecurringRevenue: 500000,
          currency: 'EUR'
        });

        const callArgs = mockFetch.mock.calls[0][1];
        const body = JSON.parse(callArgs.body as string);

        expect(body.variables.input.annualRecurringRevenue.amountMicros).toBe(500000000000);
        expect(body.variables.input.annualRecurringRevenue.currencyCode).toBe('EUR');
      });
    });

    describe('getCompany', () => {
      it('should retrieve a company by ID', async () => {
        const mockResponse = {
          data: {
            company: {
              id: '123',
              name: 'Acme Corp',
              domainName: { primaryLinkUrl: 'https://acme.com' },
              address: {
                addressStreet1: '123 Main St',
                addressStreet2: 'Suite 100',
                addressCity: 'San Francisco',
                addressPostcode: '94111',
                addressState: 'CA',
                addressCountry: 'USA'
              },
              employees: 100,
              linkedinLink: { primaryLinkUrl: 'https://linkedin.com/company/acme' },
              xLink: { primaryLinkUrl: 'https://x.com/acmecorp' },
              annualRecurringRevenue: {
                amountMicros: 1000000000000,
                currencyCode: 'USD'
              },
              idealCustomerProfile: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getCompany('123');

        expect(result.content[0].text).toContain('Company details:');
        expect(result.content[0].text).toContain('Acme Corp');
      });
    });

    describe('listCompanies', () => {
      it('should list companies without filters', async () => {
        const mockResponse = {
          data: {
            companies: {
              edges: [
                {
                  node: {
                    id: '123',
                    name: 'Acme Corp',
                    domainName: { primaryLinkUrl: 'https://acme.com' },
                    address: null,
                    employees: 100,
                    annualRecurringRevenue: null,
                    idealCustomerProfile: false
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listCompanies({});

        expect(result.content[0].text).toContain('Found 1 companies');
      });

      it('should list companies with search term', async () => {
        const mockResponse = {
          data: {
            companies: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listCompanies({ searchTerm: 'Acme' });

        expect(result.content[0].text).toContain('Found 0 companies');
      });
    });

    describe('updateCompany', () => {
      it('should update a company with partial fields', async () => {
        const mockResponse = {
          data: {
            updateCompany: {
              id: '123',
              name: 'Acme Corporation',
              domainName: { primaryLinkUrl: 'https://acmecorp.com' },
              address: null,
              employees: 150,
              annualRecurringRevenue: null,
              updatedAt: '2024-01-03T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateCompany({
          id: '123',
          name: 'Acme Corporation',
          employees: 150
        });

        expect(result.content[0].text).toContain('Updated company');
      });

      it('should update ARR with currency conversion', async () => {
        const mockResponse = {
          data: {
            updateCompany: {
              id: '123',
              name: 'Acme Corp',
              domainName: null,
              address: null,
              employees: 100,
              annualRecurringRevenue: {
                amountMicros: 2000000000000,
                currencyCode: 'GBP'
              },
              updatedAt: '2024-01-03T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await server.updateCompany({
          id: '123',
          annualRecurringRevenue: 2000000,
          currency: 'GBP'
        });

        const callArgs = mockFetch.mock.calls[0][1];
        const body = JSON.parse(callArgs.body as string);

        expect(body.variables.input.annualRecurringRevenue.amountMicros).toBe(2000000000000);
        expect(body.variables.input.annualRecurringRevenue.currencyCode).toBe('GBP');
      });
    });
  });

  describe('Opportunity Operations', () => {
    describe('createOpportunity', () => {
      it('should create an opportunity with required fields only', async () => {
        const mockResponse = {
          data: {
            createOpportunity: {
              id: 'opp-123',
              name: 'Big Deal',
              amount: null,
              stage: null,
              closeDate: null,
              companyId: null,
              company: null,
              pointOfContactId: null,
              pointOfContact: null,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createOpportunity({
          name: 'Big Deal'
        });

        expect(result.content[0].text).toContain('Created opportunity: Big Deal');
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should create an opportunity with all fields', async () => {
        const mockResponse = {
          data: {
            createOpportunity: {
              id: 'opp-123',
              name: 'Enterprise Deal',
              amount: {
                amountMicros: 250000000000,
                currencyCode: 'USD'
              },
              stage: 'PROPOSAL',
              closeDate: '2024-12-31',
              companyId: 'comp-123',
              company: {
                id: 'comp-123',
                name: 'Acme Corp'
              },
              pointOfContactId: 'person-123',
              pointOfContact: {
                id: 'person-123',
                name: { firstName: 'John', lastName: 'Doe' }
              },
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createOpportunity({
          name: 'Enterprise Deal',
          amount: 250000,
          currency: 'USD',
          stage: 'PROPOSAL',
          closeDate: '2024-12-31',
          companyId: 'comp-123',
          pointOfContactId: 'person-123'
        });

        expect(result.content[0].text).toContain('Created opportunity: Enterprise Deal');
        expect(result.content[0].text).toContain('250000000000');
      });

      it('should convert amount to micros correctly', async () => {
        const mockResponse = {
          data: {
            createOpportunity: {
              id: 'opp-123',
              name: 'Medium Deal',
              amount: {
                amountMicros: 100000000000,
                currencyCode: 'EUR'
              },
              stage: 'NEW',
              closeDate: null,
              companyId: null,
              company: null,
              pointOfContactId: null,
              pointOfContact: null,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await server.createOpportunity({
          name: 'Medium Deal',
          amount: 100000,
          currency: 'EUR'
        });

        const callArgs = mockFetch.mock.calls[0][1];
        const body = JSON.parse(callArgs.body as string);

        expect(body.variables.input.amount.amountMicros).toBe(100000000000);
        expect(body.variables.input.amount.currencyCode).toBe('EUR');
      });

      it('should use default currency when not specified', async () => {
        const mockResponse = {
          data: {
            createOpportunity: {
              id: 'opp-123',
              name: 'Deal',
              amount: {
                amountMicros: 50000000000,
                currencyCode: 'USD'
              },
              stage: null,
              closeDate: null,
              companyId: null,
              company: null,
              pointOfContactId: null,
              pointOfContact: null,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await server.createOpportunity({
          name: 'Deal',
          amount: 50000
        });

        const callArgs = mockFetch.mock.calls[0][1];
        const body = JSON.parse(callArgs.body as string);

        expect(body.variables.input.amount.currencyCode).toBe('USD');
      });
    });

    describe('getOpportunity', () => {
      it('should retrieve an opportunity by ID', async () => {
        const mockResponse = {
          data: {
            opportunity: {
              id: 'opp-123',
              name: 'Big Deal',
              amount: {
                amountMicros: 500000000000,
                currencyCode: 'USD'
              },
              stage: 'MEETING',
              closeDate: '2024-06-30',
              companyId: 'comp-123',
              company: {
                id: 'comp-123',
                name: 'Acme Corp'
              },
              pointOfContactId: 'person-123',
              pointOfContact: {
                id: 'person-123',
                name: { firstName: 'John', lastName: 'Doe' }
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getOpportunity('opp-123');

        expect(result.content[0].text).toContain('Opportunity details:');
        expect(result.content[0].text).toContain('Big Deal');
        expect(result.content[0].text).toContain('MEETING');
      });
    });

    describe('listOpportunities', () => {
      it('should list opportunities without filters', async () => {
        const mockResponse = {
          data: {
            opportunities: {
              edges: [
                {
                  node: {
                    id: 'opp-123',
                    name: 'Deal 1',
                    amount: {
                      amountMicros: 100000000000,
                      currencyCode: 'USD'
                    },
                    stage: 'NEW',
                    closeDate: '2024-12-31',
                    companyId: 'comp-123',
                    company: {
                      id: 'comp-123',
                      name: 'Acme Corp'
                    },
                    pointOfContactId: null,
                    pointOfContact: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listOpportunities({});

        expect(result.content[0].text).toContain('Found 1 opportunities');
      });

      it('should list opportunities with search term', async () => {
        const mockResponse = {
          data: {
            opportunities: {
              edges: [
                {
                  node: {
                    id: 'opp-123',
                    name: 'Enterprise Deal',
                    amount: null,
                    stage: 'PROPOSAL',
                    closeDate: null,
                    companyId: null,
                    company: null,
                    pointOfContactId: null,
                    pointOfContact: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listOpportunities({ searchTerm: 'Enterprise' });

        expect(result.content[0].text).toContain('Found 1 opportunities');
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should list opportunities filtered by company', async () => {
        const mockResponse = {
          data: {
            opportunities: {
              edges: [
                {
                  node: {
                    id: 'opp-123',
                    name: 'Deal 1',
                    amount: null,
                    stage: 'NEW',
                    closeDate: null,
                    companyId: 'comp-123',
                    company: {
                      id: 'comp-123',
                      name: 'Acme Corp'
                    },
                    pointOfContactId: null,
                    pointOfContact: null
                  }
                },
                {
                  node: {
                    id: 'opp-124',
                    name: 'Deal 2',
                    amount: null,
                    stage: 'SCREENING',
                    closeDate: null,
                    companyId: 'comp-123',
                    company: {
                      id: 'comp-123',
                      name: 'Acme Corp'
                    },
                    pointOfContactId: null,
                    pointOfContact: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listOpportunities({ companyId: 'comp-123' });

        expect(result.content[0].text).toContain('Found 2 opportunities');
      });

      it('should list opportunities filtered by stage', async () => {
        const mockResponse = {
          data: {
            opportunities: {
              edges: [
                {
                  node: {
                    id: 'opp-125',
                    name: 'Hot Deal',
                    amount: {
                      amountMicros: 1000000000000,
                      currencyCode: 'USD'
                    },
                    stage: 'PROPOSAL',
                    closeDate: '2024-03-31',
                    companyId: 'comp-456',
                    company: {
                      id: 'comp-456',
                      name: 'TechCo'
                    },
                    pointOfContactId: null,
                    pointOfContact: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listOpportunities({ stage: 'PROPOSAL' });

        expect(result.content[0].text).toContain('Found 1 opportunities');
        expect(result.content[0].text).toContain('PROPOSAL');
      });

      it('should indicate when more results are available', async () => {
        const mockResponse = {
          data: {
            opportunities: {
              edges: Array(20).fill({
                node: {
                  id: 'opp-123',
                  name: 'Deal',
                  amount: null,
                  stage: 'NEW',
                  closeDate: null,
                  companyId: null,
                  company: null,
                  pointOfContactId: null,
                  pointOfContact: null
                }
              }),
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listOpportunities({ limit: 20 });

        expect(result.content[0].text).toContain('(more available)');
      });
    });

    describe('updateOpportunity', () => {
      it('should update an opportunity with partial fields', async () => {
        const mockResponse = {
          data: {
            updateOpportunity: {
              id: 'opp-123',
              name: 'Updated Deal Name',
              amount: {
                amountMicros: 300000000000,
                currencyCode: 'USD'
              },
              stage: 'CUSTOMER',
              closeDate: '2024-03-15',
              companyId: 'comp-123',
              pointOfContactId: 'person-456',
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateOpportunity({
          id: 'opp-123',
          name: 'Updated Deal Name',
          stage: 'CUSTOMER'
        });

        expect(result.content[0].text).toContain('Updated opportunity');
        expect(result.content[0].text).toContain('Updated Deal Name');
      });

      it('should update opportunity amount with currency conversion', async () => {
        const mockResponse = {
          data: {
            updateOpportunity: {
              id: 'opp-123',
              name: 'Deal',
              amount: {
                amountMicros: 750000000000,
                currencyCode: 'EUR'
              },
              stage: 'PROPOSAL',
              closeDate: null,
              companyId: null,
              pointOfContactId: null,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        await server.updateOpportunity({
          id: 'opp-123',
          amount: 750000,
          currency: 'EUR'
        });

        const callArgs = mockFetch.mock.calls[0][1];
        const body = JSON.parse(callArgs.body as string);

        expect(body.variables.input.amount.amountMicros).toBe(750000000000);
        expect(body.variables.input.amount.currencyCode).toBe('EUR');
      });

      it('should update opportunity stage only', async () => {
        const mockResponse = {
          data: {
            updateOpportunity: {
              id: 'opp-123',
              name: 'Deal',
              amount: null,
              stage: 'MEETING',
              closeDate: null,
              companyId: null,
              pointOfContactId: null,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateOpportunity({
          id: 'opp-123',
          stage: 'MEETING'
        });

        expect(result.content[0].text).toContain('Updated opportunity');
        expect(result.content[0].text).toContain('MEETING');
      });

      it('should update opportunity close date', async () => {
        const mockResponse = {
          data: {
            updateOpportunity: {
              id: 'opp-123',
              name: 'Deal',
              amount: null,
              stage: 'PROPOSAL',
              closeDate: '2024-12-31',
              companyId: null,
              pointOfContactId: null,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateOpportunity({
          id: 'opp-123',
          closeDate: '2024-12-31'
        });

        expect(result.content[0].text).toContain('Updated opportunity');
        expect(result.content[0].text).toContain('2024-12-31');
      });
    });
  });

  describe('Task Operations', () => {
    describe('createTask', () => {
      it('should create a task with required fields only', async () => {
        const mockResponse = {
          data: {
            createTask: {
              id: 'task-123',
              title: 'Follow up with client',
              bodyV2: null,
              status: 'TODO',
              dueAt: null,
              position: 0,
              assigneeId: null,
              assignee: null,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createTask({
          title: 'Follow up with client'
        });

        expect(result.content[0].text).toContain('✅ Created task: Follow up with client');
      });

      it('should create a task with all fields', async () => {
        const mockResponse = {
          data: {
            createTask: {
              id: 'task-123',
              title: 'Review proposal',
              bodyV2: {
                blocknote: 'Review and approve the Q4 proposal',
                markdown: 'Review and approve the Q4 proposal'
              },
              status: 'IN_PROGRESS',
              dueAt: '2024-12-31T23:59:59Z',
              position: 0,
              assigneeId: 'user-456',
              assignee: {
                id: 'user-456',
                name: {
                  firstName: 'John',
                  lastName: 'Doe'
                }
              },
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createTask({
          title: 'Review proposal',
          body: 'Review and approve the Q4 proposal',
          status: 'IN_PROGRESS',
          dueAt: '2024-12-31T23:59:59Z',
          assigneeId: 'user-456'
        });

        expect(result.content[0].text).toContain('✅ Created task: Review proposal');
      });
    });

    describe('getTask', () => {
      it('should retrieve a task by ID', async () => {
        const mockResponse = {
          data: {
            task: {
              id: 'task-123',
              title: 'Complete documentation',
              bodyV2: {
                blocknote: 'Write comprehensive API docs',
                markdown: 'Write comprehensive API docs'
              },
              status: 'IN_PROGRESS',
              dueAt: '2024-12-31T23:59:59Z',
              position: 1,
              assigneeId: 'user-456',
              assignee: {
                id: 'user-456',
                name: {
                  firstName: 'Jane',
                  lastName: 'Smith'
                }
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
              deletedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getTask('task-123');

        expect(result.content[0].text).toContain('Task details:');
        expect(result.content[0].text).toContain('Complete documentation');
      });
    });

    describe('listTasks', () => {
      it('should list tasks without filters', async () => {
        const mockResponse = {
          data: {
            tasks: {
              edges: [
                {
                  node: {
                    id: 'task-123',
                    title: 'Task 1',
                    bodyV2: null,
                    status: 'TODO',
                    dueAt: null,
                    position: 0,
                    assigneeId: null,
                    assignee: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listTasks({});

        expect(result.content[0].text).toContain('Found 1 tasks');
      });

      it('should list tasks with status filter', async () => {
        const mockResponse = {
          data: {
            tasks: {
              edges: [
                {
                  node: {
                    id: 'task-123',
                    title: 'Active Task',
                    bodyV2: null,
                    status: 'IN_PROGRESS',
                    dueAt: null,
                    position: 0,
                    assigneeId: null,
                    assignee: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listTasks({ status: 'IN_PROGRESS' });

        expect(result.content[0].text).toContain('Found 1 tasks');
      });
    });

    describe('updateTask', () => {
      it('should update task status', async () => {
        const mockResponse = {
          data: {
            updateTask: {
              id: 'task-123',
              title: 'Task',
              bodyV2: null,
              status: 'DONE',
              dueAt: null,
              position: 0,
              assigneeId: null,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateTask({
          id: 'task-123',
          status: 'DONE'
        });

        expect(result.content[0].text).toContain('Updated task');
        expect(result.content[0].text).toContain('DONE');
      });
    });
  });

  describe('Note Operations', () => {
    describe('createNote', () => {
      it('should create a note with required fields only', async () => {
        const mockResponse = {
          data: {
            createNote: {
              id: 'note-123',
              title: 'Meeting notes',
              bodyV2: null,
              position: 0,
              createdBy: {
                source: 'API'
              },
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createNote({
          title: 'Meeting notes'
        });

        expect(result.content[0].text).toContain('✅ Created note: Meeting notes');
      });

      it('should create a note with body', async () => {
        const mockResponse = {
          data: {
            createNote: {
              id: 'note-123',
              title: 'Project summary',
              bodyV2: {
                blocknote: '# Project Summary\n\nKey points from discussion',
                markdown: '# Project Summary\n\nKey points from discussion'
              },
              position: 0,
              createdBy: {
                source: 'API'
              },
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createNote({
          title: 'Project summary',
          body: '# Project Summary\n\nKey points from discussion'
        });

        expect(result.content[0].text).toContain('✅ Created note: Project summary');
      });
    });

    describe('getNote', () => {
      it('should retrieve a note by ID', async () => {
        const mockResponse = {
          data: {
            note: {
              id: 'note-123',
              title: 'Client feedback',
              bodyV2: {
                blocknote: 'Client requested additional features',
                markdown: 'Client requested additional features'
              },
              position: 1,
              createdBy: {
                source: 'API'
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
              deletedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getNote('note-123');

        expect(result.content[0].text).toContain('Note details:');
        expect(result.content[0].text).toContain('Client feedback');
      });
    });

    describe('listNotes', () => {
      it('should list notes without filters', async () => {
        const mockResponse = {
          data: {
            notes: {
              edges: [
                {
                  node: {
                    id: 'note-123',
                    title: 'Note 1',
                    bodyV2: null,
                    position: 0,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listNotes({});

        expect(result.content[0].text).toContain('Found 1 notes');
      });

      it('should list notes with search term', async () => {
        const mockResponse = {
          data: {
            notes: {
              edges: [
                {
                  node: {
                    id: 'note-123',
                    title: 'Important note',
                    bodyV2: null,
                    position: 0,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listNotes({ searchTerm: 'Important' });

        expect(result.content[0].text).toContain('Found 1 notes');
      });
    });

    describe('updateNote', () => {
      it('should update note title', async () => {
        const mockResponse = {
          data: {
            updateNote: {
              id: 'note-123',
              title: 'Updated note title',
              bodyV2: null,
              position: 0,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateNote({
          id: 'note-123',
          title: 'Updated note title'
        });

        expect(result.content[0].text).toContain('Updated note');
        expect(result.content[0].text).toContain('Updated note title');
      });

      it('should update note body', async () => {
        const mockResponse = {
          data: {
            updateNote: {
              id: 'note-123',
              title: 'Note',
              bodyV2: {
                blocknote: 'New content',
                markdown: 'New content'
              },
              position: 0,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateNote({
          id: 'note-123',
          body: 'New content'
        });

        expect(result.content[0].text).toContain('Updated note');
      });
    });
  });

  describe('TaskTarget Operations', () => {
    describe('createTaskTarget', () => {
      it('should create a task target linking to a person', async () => {
        const mockResponse = {
          data: {
            createTaskTarget: {
              id: 'target-123',
              taskId: 'task-123',
              personId: 'person-123',
              companyId: null,
              opportunityId: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createTaskTarget({
          taskId: 'task-123',
          personId: 'person-123'
        });

        expect(result.content[0].text).toContain('Linked task to person');
        expect(result.content[0].text).toContain('person-123');
      });

      it('should create a task target linking to a company', async () => {
        const mockResponse = {
          data: {
            createTaskTarget: {
              id: 'target-124',
              taskId: 'task-123',
              personId: null,
              companyId: 'company-123',
              opportunityId: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createTaskTarget({
          taskId: 'task-123',
          companyId: 'company-123'
        });

        expect(result.content[0].text).toContain('Linked task to company');
      });

      it('should throw error when no target is provided', async () => {
        await expect(
          server.createTaskTarget({
            taskId: 'task-123'
          })
        ).rejects.toThrow('At least one target');
      });
    });

    describe('listTaskTargets', () => {
      it('should list task targets for a specific task', async () => {
        const mockResponse = {
          data: {
            taskTargets: {
              edges: [
                {
                  node: {
                    id: 'target-123',
                    taskId: 'task-123',
                    personId: 'person-123',
                    companyId: null,
                    opportunityId: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listTaskTargets({ taskId: 'task-123' });

        expect(result.content[0].text).toContain('Found 1 task target');
      });
    });

    describe('deleteTaskTarget', () => {
      it('should delete a task target', async () => {
        const mockResponse = {
          data: {
            deleteTaskTarget: {
              id: 'target-123'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.deleteTaskTarget('target-123');

        expect(result.content[0].text).toContain('Deleted task target');
        expect(result.content[0].text).toContain('target-123');
      });
    });
  });

  describe('NoteTarget Operations', () => {
    describe('createNoteTarget', () => {
      it('should create a note target linking to a person', async () => {
        const mockResponse = {
          data: {
            createNoteTarget: {
              id: 'target-125',
              noteId: 'note-123',
              personId: 'person-123',
              companyId: null,
              opportunityId: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createNoteTarget({
          noteId: 'note-123',
          personId: 'person-123'
        });

        expect(result.content[0].text).toContain('Linked note to person');
        expect(result.content[0].text).toContain('person-123');
      });

      it('should create a note target linking to an opportunity', async () => {
        const mockResponse = {
          data: {
            createNoteTarget: {
              id: 'target-126',
              noteId: 'note-123',
              personId: null,
              companyId: null,
              opportunityId: 'opp-123',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createNoteTarget({
          noteId: 'note-123',
          opportunityId: 'opp-123'
        });

        expect(result.content[0].text).toContain('Linked note to opportunity');
      });

      it('should throw error when no target is provided', async () => {
        await expect(
          server.createNoteTarget({
            noteId: 'note-123'
          })
        ).rejects.toThrow('At least one target');
      });
    });

    describe('listNoteTargets', () => {
      it('should list note targets for a specific company', async () => {
        const mockResponse = {
          data: {
            noteTargets: {
              edges: [
                {
                  node: {
                    id: 'target-127',
                    noteId: 'note-123',
                    personId: null,
                    companyId: 'company-123',
                    opportunityId: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                },
                {
                  node: {
                    id: 'target-128',
                    noteId: 'note-124',
                    personId: null,
                    companyId: 'company-123',
                    opportunityId: null,
                    createdAt: '2024-01-02T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listNoteTargets({ companyId: 'company-123' });

        expect(result.content[0].text).toContain('Found 2 note target');
      });
    });

    describe('deleteNoteTarget', () => {
      it('should delete a note target', async () => {
        const mockResponse = {
          data: {
            deleteNoteTarget: {
              id: 'target-129'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.deleteNoteTarget('target-129');

        expect(result.content[0].text).toContain('Deleted note target');
        expect(result.content[0].text).toContain('target-129');
      });
    });
  });

  describe('TimelineActivity Operations', () => {
    describe('createTimelineActivity', () => {
      it('should create a timeline activity with required fields', async () => {
        const mockResponse = {
          data: {
            createTimelineActivity: {
              id: 'timeline-123',
              name: 'Call with client',
              properties: null,
              happensAt: null,
              linkedRecordId: null,
              linkedObjectMetadataId: null,
              linkedRecordCachedName: null,
              workspaceMemberId: null,
              personId: null,
              companyId: null,
              opportunityId: null,
              noteId: null,
              taskId: null,
              workflowId: null,
              workflowVersionId: null,
              workflowRunId: null,
              dashboardId: null,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createTimelineActivity({
          name: 'Call with client'
        });

        expect(result.content[0].text).toContain('Created timeline activity: Call with client');
      });

      it('should create a timeline activity with all fields', async () => {
        const mockResponse = {
          data: {
            createTimelineActivity: {
              id: 'timeline-124',
              name: 'Meeting with prospect',
              properties: { type: 'MEETING', notes: 'Discussed pricing and timeline' },
              happensAt: '2024-01-15T14:00:00Z',
              linkedRecordId: null,
              linkedObjectMetadataId: null,
              linkedRecordCachedName: null,
              workspaceMemberId: 'user-123',
              personId: 'person-123',
              companyId: 'company-123',
              opportunityId: 'opp-123',
              noteId: null,
              taskId: null,
              workflowId: null,
              workflowVersionId: null,
              workflowRunId: null,
              dashboardId: null,
              createdAt: '2024-01-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createTimelineActivity({
          name: 'Meeting with prospect',
          properties: { type: 'MEETING', notes: 'Discussed pricing and timeline' },
          happensAt: '2024-01-15T14:00:00Z',
          workspaceMemberId: 'user-123',
          personId: 'person-123',
          companyId: 'company-123',
          opportunityId: 'opp-123'
        });

        expect(result.content[0].text).toContain('Created timeline activity: Meeting with prospect');
      });
    });

    describe('getTimelineActivity', () => {
      it('should get a timeline activity by ID', async () => {
        const mockResponse = {
          data: {
            timelineActivity: {
              id: 'timeline-123',
              name: 'Email sent',
              properties: { type: 'EMAIL', subject: 'Follow-up' },
              happensAt: '2024-01-10T10:00:00Z',
              linkedRecordId: null,
              linkedObjectMetadataId: null,
              linkedRecordCachedName: null,
              workspaceMemberId: null,
              personId: 'person-123',
              companyId: null,
              opportunityId: null,
              noteId: null,
              taskId: null,
              workflowId: null,
              workflowVersionId: null,
              workflowRunId: null,
              dashboardId: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getTimelineActivity('timeline-123');

        expect(result.content[0].text).toContain('TimelineActivity details');
        expect(result.content[0].text).toContain('Email sent');
      });
    });

    describe('listTimelineActivities', () => {
      it('should list all timeline activities', async () => {
        const mockResponse = {
          data: {
            timelineActivities: {
              edges: [
                {
                  node: {
                    id: 'timeline-123',
                    name: 'Call',
                    properties: null,
                    happensAt: null,
                    linkedRecordId: null,
                    linkedObjectMetadataId: null,
                    linkedRecordCachedName: null,
                    workspaceMemberId: null,
                    personId: null,
                    companyId: null,
                    opportunityId: null,
                    noteId: null,
                    taskId: null,
                    workflowId: null,
                    workflowVersionId: null,
                    workflowRunId: null,
                    dashboardId: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                },
                {
                  node: {
                    id: 'timeline-124',
                    name: 'Email',
                    properties: null,
                    happensAt: null,
                    linkedRecordId: null,
                    linkedObjectMetadataId: null,
                    linkedRecordCachedName: null,
                    workspaceMemberId: null,
                    personId: null,
                    companyId: null,
                    opportunityId: null,
                    noteId: null,
                    taskId: null,
                    workflowId: null,
                    workflowVersionId: null,
                    workflowRunId: null,
                    dashboardId: null,
                    createdAt: '2024-01-02T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listTimelineActivities();

        expect(result.content[0].text).toContain('Found 2 timelineActivit');
      });

      it('should list timeline activities filtered by company', async () => {
        const mockResponse = {
          data: {
            timelineActivities: {
              edges: [
                {
                  node: {
                    id: 'timeline-125',
                    name: 'Meeting',
                    properties: { notes: 'Quarterly review' },
                    happensAt: '2024-01-15T14:00:00Z',
                    linkedRecordId: null,
                    linkedObjectMetadataId: null,
                    linkedRecordCachedName: null,
                    workspaceMemberId: null,
                    personId: 'person-123',
                    companyId: 'company-123',
                    opportunityId: null,
                    noteId: null,
                    taskId: null,
                    workflowId: null,
                    workflowVersionId: null,
                    workflowRunId: null,
                    dashboardId: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listTimelineActivities({ companyId: 'company-123' });

        expect(result.content[0].text).toContain('Found 1 timelineActivit');
      });

      it('should list timeline activities filtered by person', async () => {
        const mockResponse = {
          data: {
            timelineActivities: {
              edges: [
                {
                  node: {
                    id: 'timeline-126',
                    name: 'Call',
                    properties: null,
                    happensAt: null,
                    linkedRecordId: null,
                    linkedObjectMetadataId: null,
                    linkedRecordCachedName: null,
                    workspaceMemberId: null,
                    personId: 'person-123',
                    companyId: null,
                    opportunityId: null,
                    noteId: null,
                    taskId: null,
                    workflowId: null,
                    workflowVersionId: null,
                    workflowRunId: null,
                    dashboardId: null,
                    createdAt: '2024-01-03T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listTimelineActivities({ personId: 'person-123' });

        expect(result.content[0].text).toContain('Found 1 timelineActivit');
        expect(result.content[0].text).toContain('more available');
      });
    });

    describe('updateTimelineActivity', () => {
      it('should update timeline activity name', async () => {
        const mockResponse = {
          data: {
            updateTimelineActivity: {
              id: 'timeline-123',
              name: 'Updated meeting title',
              properties: { notes: 'Original content' },
              happensAt: null,
              linkedRecordId: null,
              linkedObjectMetadataId: null,
              linkedRecordCachedName: null,
              workspaceMemberId: null,
              personId: null,
              companyId: null,
              opportunityId: null,
              noteId: null,
              taskId: null,
              workflowId: null,
              workflowVersionId: null,
              workflowRunId: null,
              dashboardId: null,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateTimelineActivity({
          id: 'timeline-123',
          name: 'Updated meeting title'
        });

        expect(result.content[0].text).toContain('Updated timelineActivity');
        expect(result.content[0].text).toContain('Updated meeting title');
      });

      it('should update timeline activity properties and happensAt', async () => {
        const mockResponse = {
          data: {
            updateTimelineActivity: {
              id: 'timeline-124',
              name: 'Meeting',
              properties: { notes: 'Updated notes from meeting' },
              happensAt: '2024-01-20T15:00:00Z',
              linkedRecordId: null,
              linkedObjectMetadataId: null,
              linkedRecordCachedName: null,
              workspaceMemberId: null,
              personId: null,
              companyId: null,
              opportunityId: null,
              noteId: null,
              taskId: null,
              workflowId: null,
              workflowVersionId: null,
              workflowRunId: null,
              dashboardId: null,
              updatedAt: '2024-02-01T00:00:00Z'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.updateTimelineActivity({
          id: 'timeline-124',
          properties: { notes: 'Updated notes from meeting' },
          happensAt: '2024-01-20T15:00:00Z'
        });

        expect(result.content[0].text).toContain('Updated timelineActivity');
      });
    });
  });

  describe('Favorite Operations', () => {
    describe('addFavorite', () => {
      it('should add a person to favorites', async () => {
        const mockResponse = {
          data: {
            createFavorite: {
              id: 'fav-123',
              position: 1,
              personId: 'person-123',
              companyId: null,
              opportunityId: null,
              workspaceMemberId: 'user-123',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.addFavorite({
          personId: 'person-123'
        });

        expect(result.content[0].text).toContain('Added person to favorites');
        expect(result.content[0].text).toContain('person-123');
      });

      it('should add a company to favorites with position', async () => {
        const mockResponse = {
          data: {
            createFavorite: {
              id: 'fav-124',
              position: 5,
              personId: null,
              companyId: 'company-123',
              opportunityId: null,
              workspaceMemberId: 'user-123',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.addFavorite({
          companyId: 'company-123',
          position: 5
        });

        expect(result.content[0].text).toContain('Added company to favorites');
      });

      it('should throw error when no target is provided', async () => {
        await expect(
          server.addFavorite({})
        ).rejects.toThrow('At least one target');
      });
    });

    describe('getFavorite', () => {
      it('should get a favorite by ID', async () => {
        const mockResponse = {
          data: {
            favorite: {
              id: 'fav-123',
              position: 1,
              personId: 'person-123',
              companyId: null,
              opportunityId: null,
              workspaceMemberId: 'user-123',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getFavorite('fav-123');

        expect(result.content[0].text).toContain('Favorite details');
        expect(result.content[0].text).toContain('person-123');
      });
    });

    describe('listFavorites', () => {
      it('should list all favorites', async () => {
        const mockResponse = {
          data: {
            favorites: {
              edges: [
                {
                  node: {
                    id: 'fav-123',
                    position: 1,
                    personId: 'person-123',
                    companyId: null,
                    opportunityId: null,
                    workspaceMemberId: 'user-123',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                },
                {
                  node: {
                    id: 'fav-124',
                    position: 2,
                    personId: null,
                    companyId: 'company-123',
                    opportunityId: null,
                    workspaceMemberId: 'user-123',
                    createdAt: '2024-01-02T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listFavorites();

        expect(result.content[0].text).toContain('Found 2 favorite');
      });

      it('should list favorites filtered by company', async () => {
        const mockResponse = {
          data: {
            favorites: {
              edges: [
                {
                  node: {
                    id: 'fav-125',
                    position: 3,
                    personId: null,
                    companyId: 'company-123',
                    opportunityId: null,
                    workspaceMemberId: 'user-123',
                    createdAt: '2024-01-03T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listFavorites({ companyId: 'company-123' });

        expect(result.content[0].text).toContain('Found 1 favorite');
      });
    });

    describe('removeFavorite', () => {
      it('should remove a favorite', async () => {
        const mockResponse = {
          data: {
            deleteFavorite: {
              id: 'fav-123'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.removeFavorite('fav-123');

        expect(result.content[0].text).toContain('Removed favorite');
        expect(result.content[0].text).toContain('fav-123');
      });
    });
  });

  describe('Attachment Operations', () => {
    describe('createAttachment', () => {
      it('should create an attachment linked to a task', async () => {
        const mockResponse = {
          data: {
            createAttachment: {
              id: 'att-123',
              name: 'project-specs.pdf',
              fullPath: 'https://storage.example.com/files/project-specs.pdf',
              type: null,
              fileCategory: 'TEXT_DOCUMENT',
              taskId: 'task-456',
              opportunityId: null,
              companyId: null,
              personId: null,
              workflowId: null,
              dashboardId: null,
              authorId: 'user-789',
              createdBy: {
                source: 'API'
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createAttachment({
          name: 'project-specs.pdf',
          fullPath: 'https://storage.example.com/files/project-specs.pdf',
          fileCategory: 'TEXT_DOCUMENT',
          taskId: 'task-456'
        });

        expect(result.content[0].text).toContain('✅ Created attachment: project-specs.pdf');
        expect(result.content[0].text).toContain('task (task-456)');
      });

      it('should create an attachment linked to a company', async () => {
        const mockResponse = {
          data: {
            createAttachment: {
              id: 'att-124',
              name: 'company-logo.png',
              fullPath: 'https://storage.example.com/logos/company-logo.png',
              type: null,
              fileCategory: 'IMAGE',
              taskId: null,
              opportunityId: null,
              companyId: 'comp-123',
              personId: null,
              workflowId: null,
              dashboardId: null,
              authorId: null,
              createdBy: {
                source: 'API'
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createAttachment({
          name: 'company-logo.png',
          fullPath: 'https://storage.example.com/logos/company-logo.png',
          fileCategory: 'IMAGE',
          companyId: 'comp-123'
        });

        expect(result.content[0].text).toContain('✅ Created attachment: company-logo.png');
        expect(result.content[0].text).toContain('company (comp-123)');
      });

      it('should create an attachment with all file categories', async () => {
        const mockResponse = {
          data: {
            createAttachment: {
              id: 'att-125',
              name: 'presentation.pptx',
              fullPath: 'https://storage.example.com/files/presentation.pptx',
              type: null,
              fileCategory: 'PRESENTATION',
              taskId: null,
              opportunityId: 'opp-789',
              companyId: null,
              personId: null,
              workflowId: null,
              dashboardId: null,
              authorId: null,
              createdBy: {
                source: 'API'
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.createAttachment({
          name: 'presentation.pptx',
          fullPath: 'https://storage.example.com/files/presentation.pptx',
          fileCategory: 'PRESENTATION',
          opportunityId: 'opp-789'
        });

        expect(result.content[0].text).toContain('✅ Created attachment: presentation.pptx');
        expect(result.content[0].text).toContain('opportunity (opp-789)');
      });

      it('should throw error when no relationship ID is provided', async () => {
        await expect(
          server.createAttachment({
            name: 'orphan.pdf',
            fullPath: 'https://storage.example.com/orphan.pdf'
          })
        ).rejects.toThrow('At least one relationship ID');
      });
    });

    describe('getAttachment', () => {
      it('should retrieve an attachment by ID', async () => {
        const mockResponse = {
          data: {
            attachment: {
              id: 'att-123',
              name: 'contract.pdf',
              fullPath: 'https://storage.example.com/contracts/contract.pdf',
              type: null,
              fileCategory: 'TEXT_DOCUMENT',
              taskId: null,
              opportunityId: null,
              companyId: 'comp-456',
              personId: null,
              workflowId: null,
              dashboardId: null,
              authorId: 'user-789',
              createdBy: {
                source: 'API'
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
              deletedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getAttachment('att-123');

        expect(result.content[0].text).toContain('Attachment details:');
        expect(result.content[0].text).toContain('contract.pdf');
      });
    });

    describe('listAttachments', () => {
      it('should list attachments without filters', async () => {
        const mockResponse = {
          data: {
            attachments: {
              edges: [
                {
                  node: {
                    id: 'att-123',
                    name: 'document1.pdf',
                    fullPath: 'https://storage.example.com/document1.pdf',
                    type: null,
                    fileCategory: 'TEXT_DOCUMENT',
                    taskId: 'task-456',
                    opportunityId: null,
                    companyId: null,
                    personId: null,
                    workflowId: null,
                    dashboardId: null,
                    authorId: null,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                },
                {
                  node: {
                    id: 'att-124',
                    name: 'image.png',
                    fullPath: 'https://storage.example.com/image.png',
                    type: null,
                    fileCategory: 'IMAGE',
                    taskId: null,
                    opportunityId: null,
                    companyId: 'comp-789',
                    personId: null,
                    workflowId: null,
                    dashboardId: null,
                    authorId: null,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-02T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listAttachments({});

        expect(result.content[0].text).toContain('Found 2 attachment(s)');
      });

      it('should list attachments filtered by taskId', async () => {
        const mockResponse = {
          data: {
            attachments: {
              edges: [
                {
                  node: {
                    id: 'att-123',
                    name: 'task-file.pdf',
                    fullPath: 'https://storage.example.com/task-file.pdf',
                    type: null,
                    fileCategory: 'TEXT_DOCUMENT',
                    taskId: 'task-456',
                    opportunityId: null,
                    companyId: null,
                    personId: null,
                    workflowId: null,
                    dashboardId: null,
                    authorId: null,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listAttachments({ taskId: 'task-456' });

        expect(result.content[0].text).toContain('Found 1 attachment(s)');
        expect(result.content[0].text).toContain('task-456');
      });

      it('should list attachments filtered by companyId', async () => {
        const mockResponse = {
          data: {
            attachments: {
              edges: [
                {
                  node: {
                    id: 'att-124',
                    name: 'company-doc.pdf',
                    fullPath: 'https://storage.example.com/company-doc.pdf',
                    type: null,
                    fileCategory: 'TEXT_DOCUMENT',
                    taskId: null,
                    opportunityId: null,
                    companyId: 'comp-123',
                    personId: null,
                    workflowId: null,
                    dashboardId: null,
                    authorId: null,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listAttachments({ companyId: 'comp-123' });

        expect(result.content[0].text).toContain('Found 1 attachment(s)');
        expect(result.content[0].text).toContain('comp-123');
      });

      it('should list attachments filtered by fileCategory', async () => {
        const mockResponse = {
          data: {
            attachments: {
              edges: [
                {
                  node: {
                    id: 'att-125',
                    name: 'photo.jpg',
                    fullPath: 'https://storage.example.com/photo.jpg',
                    type: null,
                    fileCategory: 'IMAGE',
                    taskId: null,
                    opportunityId: null,
                    companyId: null,
                    personId: 'person-123',
                    workflowId: null,
                    dashboardId: null,
                    authorId: null,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listAttachments({ fileCategory: 'IMAGE' });

        expect(result.content[0].text).toContain('Found 1 attachment(s)');
      });

      it('should list attachments with search term', async () => {
        const mockResponse = {
          data: {
            attachments: {
              edges: [
                {
                  node: {
                    id: 'att-126',
                    name: 'important-contract.pdf',
                    fullPath: 'https://storage.example.com/important-contract.pdf',
                    type: null,
                    fileCategory: 'TEXT_DOCUMENT',
                    taskId: null,
                    opportunityId: null,
                    companyId: 'comp-456',
                    personId: null,
                    workflowId: null,
                    dashboardId: null,
                    authorId: null,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listAttachments({ searchTerm: 'contract' });

        expect(result.content[0].text).toContain('Found 1 attachment(s)');
        expect(result.content[0].text).toContain('important-contract.pdf');
      });

      it('should list attachments with pagination', async () => {
        const mockResponse = {
          data: {
            attachments: {
              edges: [
                {
                  node: {
                    id: 'att-127',
                    name: 'file1.pdf',
                    fullPath: 'https://storage.example.com/file1.pdf',
                    type: null,
                    fileCategory: 'TEXT_DOCUMENT',
                    taskId: 'task-789',
                    opportunityId: null,
                    companyId: null,
                    personId: null,
                    workflowId: null,
                    dashboardId: null,
                    authorId: null,
                    createdBy: {
                      source: 'API'
                    },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listAttachments({ limit: 10 });

        expect(result.content[0].text).toContain('Found 1 attachment(s)');
        expect(result.content[0].text).toContain('(more available)');
      });
    });

    describe('deleteAttachment', () => {
      it('should delete an attachment', async () => {
        const mockResponse = {
          data: {
            deleteAttachment: {
              id: 'att-123'
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.deleteAttachment('att-123');

        expect(result.content[0].text).toContain('✅ Deleted attachment: att-123');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle tool errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        server.createPerson({
          firstName: 'John',
          lastName: 'Doe'
        })
      ).rejects.toThrow('Network error');
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.TWENTY_API_KEY;

      const server = new TwentyCRMServer();
      // Error should be thrown when first accessing the client
      await expect(
        server.graphqlRequest('query { test }')
      ).rejects.toThrow('TWENTY_API_KEY environment variable is required');

      // Restore for other tests
      process.env.TWENTY_API_KEY = 'test-api-key';
    });
  });

  describe('Workspace Member Operations', () => {
    describe('listWorkspaceMembers', () => {
      it('should list all workspace members', async () => {
        const mockResponse = {
          data: {
            workspaceMembers: {
              edges: [
                {
                  node: {
                    id: 'member-123',
                    name: { firstName: 'Alice', lastName: 'Smith' },
                    userEmail: 'alice@example.com',
                    avatarUrl: null,
                    locale: 'en',
                    colorScheme: 'Light',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                },
                {
                  node: {
                    id: 'member-456',
                    name: { firstName: 'Bob', lastName: 'Jones' },
                    userEmail: 'bob@example.com',
                    avatarUrl: null,
                    locale: 'en',
                    colorScheme: 'Dark',
                    createdAt: '2024-01-02T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listWorkspaceMembers();

        expect(result.content[0].text).toContain('Found 2 workspace member');
        expect(result.content[0].text).toContain('alice@example.com');
        expect(result.content[0].text).toContain('bob@example.com');
      });

      it('should list workspace members with search filter', async () => {
        const mockResponse = {
          data: {
            workspaceMembers: {
              edges: [
                {
                  node: {
                    id: 'member-123',
                    name: { firstName: 'Alice', lastName: 'Smith' },
                    userEmail: 'alice@example.com',
                    avatarUrl: null,
                    locale: 'en',
                    colorScheme: 'Light',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: null
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listWorkspaceMembers({ searchTerm: 'Alice' });

        expect(result.content[0].text).toContain('Found 1 workspace member');
        expect(result.content[0].text).toContain('Alice');
      });

      it('should return empty list when no members found', async () => {
        const mockResponse = {
          data: {
            workspaceMembers: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.listWorkspaceMembers();

        expect(result.content[0].text).toContain('Found 0 workspace member');
      });
    });

    describe('getWorkspaceMember', () => {
      it('should get a workspace member by ID', async () => {
        const mockResponse = {
          data: {
            workspaceMember: {
              id: 'member-123',
              name: { firstName: 'Alice', lastName: 'Smith' },
              userEmail: 'alice@example.com',
              avatarUrl: null,
              locale: 'en',
              colorScheme: 'Light',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: null
            }
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await server.getWorkspaceMember('member-123');

        expect(result.content[0].text).toContain('Workspace member details');
        expect(result.content[0].text).toContain('alice@example.com');
        expect(result.content[0].text).toContain('Alice');
      });
    });
  });
});
