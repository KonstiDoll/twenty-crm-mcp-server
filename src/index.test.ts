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

    it('should throw error when API key is missing', () => {
      delete process.env.TWENTY_API_KEY;

      expect(() => new TwentyCRMServer()).toThrow('TWENTY_API_KEY environment variable is required');

      // Restore for other tests
      process.env.TWENTY_API_KEY = 'test-api-key';
    });
  });
});
